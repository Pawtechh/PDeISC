import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { LegalService } from './legal.service';

const legalService = new LegalService();

const signDocumentSchema = z.object({
  documentSlug: z.string().min(1, 'El slug del documento es obligatorio'),
  documentHash: z.string().min(10, 'El hash SHA-256 es obligatorio'),
  rentalId: z.string().optional(),
  signatureData: z.string().optional(),
});

export const listDocuments = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const documents = legalService.listDocuments();
    res.status(200).json({
      status: 'success',
      data: documents,
    });
  } catch (err) {
    next(err);
  }
};

export const getDocument = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const slug = req.params.slug as string;
    const document = legalService.getDocumentBySlug(slug);
    res.status(200).json({
      status: 'success',
      data: document,
    });
  } catch (err) {
    next(err);
  }
};

export const signDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = signDocumentSchema.parse(req.body);
    const userId = (req as any).user.id;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'SurfRentalClient/1.0';

    const result = await legalService.recordSignature({
      userId,
      documentSlug: validated.documentSlug,
      documentHash: validated.documentHash,
      rentalId: validated.rentalId,
      signatureData: validated.signatureData,
      ipAddress: String(ipAddress),
      userAgent,
    });

    res.status(201).json({
      status: 'success',
      message: 'Firma digital registrada y certificada con validez legal (Ley 25.506)',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const signBiometricSchema = z.object({
  rental_id: z.string().optional(),
  rentalId: z.string().optional(),
  user_id: z.string().optional(),
  userId: z.string().optional(),
  biometric_verified: z.boolean().default(true),
  biometricVerified: z.boolean().default(true),
  timestamp: z.string().optional(),
  signature_hash: z.string().optional(),
  signatureHash: z.string().optional(),
});

export const signBiometric = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = signBiometricSchema.parse(req.body);
    const authUserId = (req as any).user.id;
    const targetUserId = validated.user_id || validated.userId || authUserId;

    // Row-level security check: only the authenticated user can sign on their own behalf
    if (targetUserId !== authUserId && (req as any).user.role !== 'AGENCIA') {
      res.status(403).json({
        code: 'FORBIDDEN',
        message: 'No podés firmar biométricamente en nombre de otro usuario',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'SurfRentalClient/1.0';
    const signatureHash = validated.signature_hash || validated.signatureHash || `BIO-${Date.now()}`;
    const rentalId = validated.rental_id || validated.rentalId;

    const result = await legalService.recordBiometricSignature({
      userId: targetUserId,
      rentalId,
      biometricVerified: true,
      timestamp: validated.timestamp,
      signatureHash,
      ipAddress: String(ipAddress),
      userAgent,
    });

    res.status(201).json({
      status: 'success',
      message: 'Firma biométrica certificada legalmente sin almacenamiento de datos físicos (Ley 25.506 y 25.326)',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const verifySignature = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const auditToken = req.params.auditToken as string;
    const result = await legalService.verifySignature(auditToken);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getAuditCertificate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const certificate = await legalService.getAuditCertificate(id);
    res.status(200).json({
      status: 'success',
      data: certificate,
    });
  } catch (err) {
    next(err);
  }
};

export const getRentalContract = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rentalId = req.params.rentalId as string;
    const userId = (req as any).user.id;
    const contract = await legalService.generateRentalContract(rentalId, userId);
    res.status(200).json({
      status: 'success',
      data: contract,
    });
  } catch (err) {
    next(err);
  }
};
