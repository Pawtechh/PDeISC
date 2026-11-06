import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';
import { requireAuth } from '../../middlewares/requireAuth';
import { prisma } from '../../config/prisma';
import { JWT_CONFIG } from '../../config/jwt';
import { vendorRegistry } from '../../config/vendorRegistry';
import { systemConfig } from '../../config/systemConfig';
import { AppError } from '../../middlewares/errorHandler';
import { saveBase64Image } from '../../utils/fileStorage';

const router = Router();

router.use(requireAuth);

const generateUserTokens = async (user: { id: string; email: string; role: Role }) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, JWT_CONFIG.accessSecret, {
    expiresIn: JWT_CONFIG.accessExpiresIn,
  });

  const refreshToken = jwt.sign({ ...payload, jti: randomUUID() }, JWT_CONFIG.refreshSecret, {
    expiresIn: JWT_CONFIG.refreshExpiresIn,
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + JWT_CONFIG.refreshDays);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_CONFIG.accessExpiresIn,
  };
};

router.get('/me', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        nombre: true,
        telefono: true,
        dni: true,
        dniFotoUrl: true,
        avatarUrl: true,
        role: true,
        puntos: true,
        puntosSancion: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
      return;
    }

    let app = vendorRegistry.getByUser(user.id, user.email);
    if (!app && user.role === 'OWNER') {
      app = vendorRegistry.ensureOwnerApproved(user);
    }

    const vendorStatus = app ? app.status : user.role === 'OWNER' ? 'APROBADO' : 'NONE';
    const canSwitchRole =
      user.role !== 'AGENCIA' && (vendorStatus === 'APROBADO' || user.role === 'OWNER');

    res.status(200).json({
      status: 'success',
      data: {
        ...user,
        vendorStatus,
        canSwitchRole,
        vendorApplication: app || null,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/me', async (req, res, next) => {
  try {
    const { nombre, telefono, dni, dniFotoUrl, avatarUrl } = req.body;
    let cleanDni: string | undefined = undefined;

    if (dni !== undefined && dni !== null && String(dni).trim() !== '') {
      cleanDni = String(dni).trim();
      if (!/^\d{7,8}$/.test(cleanDni)) {
        res.status(400).json({
          code: 'INVALID_DNI',
          message: 'El DNI debe contener 7 u 8 dígitos numéricos sin puntos ni letras',
        });
        return;
      }

      const existing = await prisma.user.findFirst({
        where: {
          dni: cleanDni,
          id: { not: req.user!.id },
        },
      });

      if (existing) {
        res.status(409).json({
          code: 'DNI_ALREADY_EXISTS',
          message: 'Este DNI ya se encuentra registrado por otro usuario',
        });
        return;
      }
    }
    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        nombre: nombre || undefined,
        telefono: telefono || undefined,
        dni: cleanDni || undefined,
        dniFotoUrl: dniFotoUrl ? (saveBase64Image(dniFotoUrl, 'dni', req.user!.id) || dniFotoUrl) : undefined,
        avatarUrl: avatarUrl ? (saveBase64Image(avatarUrl, 'avatar', req.user!.id) || avatarUrl) : undefined,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        telefono: true,
        dni: true,
        dniFotoUrl: true,
        avatarUrl: true,
        role: true,
        puntos: true,
        puntosSancion: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    next(error);
  }
});

/**
 * Obtiene el estado del permiso de publicación (Perfil de Vendedor) del usuario actual
 */
/**
 * Endpoint estricto de verificación de identidad (DNI + Foto de documento)
 */
router.post('/verify-identity', async (req, res, next) => {
  try {
    const { dni, dniFotoUrl } = req.body;

    if (!dni || !/^\d{7,8}$/.test(String(dni).trim())) {
      res.status(400).json({
        code: 'INVALID_DNI',
        message: 'Debes ingresar un número de DNI válido de 7 u 8 dígitos',
      });
      return;
    }

    if (!dniFotoUrl || typeof dniFotoUrl !== 'string' || dniFotoUrl.trim().length < 10) {
      res.status(400).json({
        code: 'MISSING_DNI_PHOTO',
        message: 'Debes adjuntar una foto legible de tu DNI (frente o documento completo)',
      });
      return;
    }

    const cleanDni = String(dni).trim();
    const existing = await prisma.user.findFirst({
      where: {
        dni: cleanDni,
        id: { not: req.user!.id },
      },
    });

    if (existing) {
      res.status(409).json({
        code: 'DNI_ALREADY_EXISTS',
        message: 'Este DNI ya se encuentra registrado por otro usuario',
      });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        dni: cleanDni,
        dniFotoUrl: saveBase64Image(dniFotoUrl, 'dni', req.user!.id) || String(dniFotoUrl).trim(),
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        telefono: true,
        dni: true,
        dniFotoUrl: true,
        avatarUrl: true,
        role: true,
        puntos: true,
        puntosSancion: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Identidad y DNI verificados con éxito',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/vendor-status', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        nombre: true,
        telefono: true,
        dni: true,
        role: true,
      },
    });

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    }

    let app = vendorRegistry.getByUser(user.id, user.email);
    if (!app && user.role === 'OWNER') {
      app = vendorRegistry.ensureOwnerApproved(user);
    }

    const vendorStatus = app ? app.status : user.role === 'OWNER' ? 'APROBADO' : 'NONE';
    const canSwitchRole =
      user.role !== 'AGENCIA' && (vendorStatus === 'APROBADO' || user.role === 'OWNER');

    res.status(200).json({
      status: 'success',
      data: {
        vendorStatus,
        canSwitchRole,
        application: app || null,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Crea o actualiza una solicitud para habilitar el Perfil de Vendedor (Permiso de Publicación)
 */
router.post('/vendor-application', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    }

    if (user.role === 'AGENCIA') {
      throw new AppError(
        'FORBIDDEN_ROLE',
        'El perfil de Agencia es administrativo y no requiere solicitud de vendedor.',
        403
      );
    }

    const { nombreVendedor, descripcion, fotosTablas, experienciaRubro } = req.body;

    if (!nombreVendedor || typeof nombreVendedor !== 'string' || nombreVendedor.trim().length < 2) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Debés ingresar tu nombre de vendedor o taller/quiver (mínimo 2 caracteres).',
        400
      );
    }

    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length < 10) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Debés ingresar una descripción de tu perfil y tablas (mínimo 10 caracteres).',
        400
      );
    }

    if (
      !experienciaRubro ||
      typeof experienciaRubro !== 'string' ||
      experienciaRubro.trim().length < 5
    ) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Debés detallar tus experiencias anteriores en el rubro del surf.',
        400
      );
    }

    const fotosArray = Array.isArray(fotosTablas)
      ? fotosTablas.filter((f) => typeof f === 'string' && f.trim().length > 0)
      : typeof fotosTablas === 'string' && fotosTablas.trim().length > 0
      ? [fotosTablas.trim()]
      : [];

    if (fotosArray.length === 0) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Debés adjuntar al menos una foto de tus tablas para evaluación de la Agencia.',
        400
      );
    }

    const fotosGuardadas = fotosArray.map((foto, idx) => {
      const saved = saveBase64Image(foto, 'board', `${user.id}-${idx}`);
      return saved || foto;
    });

    const application = vendorRegistry.submitApplication({
      userId: user.id,
      userEmail: user.email,
      userNombre: user.nombre,
      userDni: user.dni,
      userTelefono: user.telefono,
      nombreVendedor,
      descripcion,
      fotosTablas: fotosGuardadas,
      experienciaRubro,
    });

    // Notificar a operadores de agencia
    try {
      const agencies = await prisma.user.findMany({
        where: { role: 'AGENCIA' },
        select: { id: true },
      });
      if (agencies.length > 0) {
        await prisma.notification.createMany({
          data: agencies.map((ag) => ({
            userId: ag.id,
            titulo: '📋 Nueva Solicitud de Vendedor',
            mensaje: `${user.nombre} (${nombreVendedor.trim()}) solicitó permiso de publicación en el catálogo.`,
            tipo: 'SISTEMA',
          })),
        });
      }
    } catch {
      // No bloquear si falla notificación
    }

    res.status(201).json({
      status: 'success',
      data: {
        vendorStatus: application.status,
        canSwitchRole: application.status === 'APROBADO',
        application,
        mensaje:
          'Solicitud de permiso de publicación enviada con éxito. La Agencia evaluará tu perfil de vendedor.',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Permite a la misma persona (excluyendo admin/agencia) alternar entre
 * perfil de Usuario (CONSUMER) y perfil de Vendedor (OWNER) validando huella dactilar O contraseña.
 */
router.post('/switch-role', async (req, res, next) => {
  try {
    const { targetRole, authMethod, biometricVerified, biometricHash, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    }

    // Regla estricta: El perfil de Admin (AGENCIA) nunca se puede alternar
    if (user.role === 'AGENCIA' || targetRole === 'AGENCIA') {
      throw new AppError(
        'ADMIN_SWITCH_FORBIDDEN',
        'El perfil de administración (Agencia) está excluido del cambio de rol.',
        403
      );
    }

    if (targetRole !== 'CONSUMER' && targetRole !== 'OWNER') {
      throw new AppError(
        'INVALID_TARGET_ROLE',
        'Solo se permite cambiar entre Perfil de Usuario (CONSUMER) y Perfil de Vendedor (OWNER).',
        400
      );
    }

    // Si el usuario ya era OWNER originalmente, asegurar que quede registrado como APROBADO
    if (user.role === 'OWNER') {
      vendorRegistry.ensureOwnerApproved(user);
    }

    const app = vendorRegistry.getByUser(user.id, user.email);
    const isApprovedVendor = app?.status === 'APROBADO' || user.role === 'OWNER';

    if (targetRole === 'OWNER' && !isApprovedVendor) {
      throw new AppError(
        'VENDOR_NOT_APPROVED',
        'Aún no contás con permiso de publicación habilitado por la Agencia. Enviá tu solicitud de perfil de vendedor y aguardá la aprobación.',
        403
      );
    }

    // Validar Huella Dactilar O Contraseña
    const hasValidBiometric =
      authMethod === 'BIOMETRIC' &&
      Boolean(biometricVerified) &&
      typeof biometricHash === 'string' &&
      biometricHash.trim().length >= 8;

    let hasValidPassword = false;
    if (authMethod === 'PASSWORD' || (!hasValidBiometric && password)) {
      if (!password || typeof password !== 'string' || !password.trim()) {
        throw new AppError(
          'CREDENTIALS_REQUIRED',
          'Debés verificar tu huella dactilar o ingresar tu contraseña para cambiar de perfil.',
          400
        );
      }

      if (user.passwordHash) {
        hasValidPassword = await bcrypt.compare(password, user.passwordHash);
      }
      // Permitir también si es cuenta OAuth o demo con clave estándar de usuario
      if (!hasValidPassword && systemConfig.validateSpecialPassword(password)) {
        hasValidPassword = true;
      }

      if (!hasValidPassword) {
        throw new AppError(
          'INVALID_PASSWORD',
          'Contraseña incorrecta. Verificá tu clave para cambiar entre perfil de Usuario y Vendedor.',
          401
        );
      }
    }

    if (!hasValidBiometric && !hasValidPassword) {
      throw new AppError(
        'AUTH_VERIFICATION_REQUIRED',
        'Debés confirmar tu identidad mediante huella dactilar o contraseña para cambiar de perfil.',
        401
      );
    }

    // Actualizar el rol activo de la MISMA persona en la base de datos
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: targetRole as Role },
      select: {
        id: true,
        email: true,
        nombre: true,
        telefono: true,
        dni: true,
        role: true,
        puntos: true,
      },
    });

    const tokens = await generateUserTokens(updatedUser);

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          ...updatedUser,
          vendorStatus: 'APROBADO',
          canSwitchRole: true,
          vendorApplication: app || null,
        },
        tokens,
        mensaje:
          targetRole === 'OWNER'
            ? 'Cambiaste a tu Perfil de Vendedor. Ya podés administrar y publicar tus tablas.'
            : 'Cambiaste a tu Perfil de Usuario (Surfista).',
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
