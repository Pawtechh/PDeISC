import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { prisma } from './prisma';
import { logger } from '../utils/logger';

export type VendorApplicationStatus = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface VendorApplication {
  id: string;
  userId: string;
  userEmail: string;
  userNombre: string;
  userDni?: string | null;
  userTelefono?: string | null;
  agencyId?: string | null;
  nombreVendedor: string;
  descripcion: string;
  fotosTablas: string[];
  experienciaRubro: string;
  status: VendorApplicationStatus;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  biometricHash?: string;
  motivoResolucion?: string;
}

const VENDOR_FILE_PATH = path.resolve(__dirname, '../../data/vendor_applications.json');

const INITIAL_SEED_APPLICATIONS: VendorApplication[] = [
  {
    id: 'vendor-req-seed-01',
    userId: 'seed-user-shaper-mdp',
    userEmail: 'lucas.quiver@surfmdp.com',
    userNombre: 'Lucas Echeverría',
    userDni: '38451920',
    userTelefono: '+54 9 223 541-8892',
    agencyId: null,
    nombreVendedor: 'Costa Atlántica Quiver & Shapes',
    descripcion:
      'Quiver seleccionado de shortboards de alto rendimiento y twin fins laminados en resina epoxi para las rompientes de Playa Grande y El Yacht. Todas las tablas incluyen quillas FCS II y leash profesional.',
    fotosTablas: [
      '/images/boards/shortboard-1.jpg',
      '/images/boards/fish-2.jpg',
    ],
    experienciaRubro:
      '8 años como shaper y reparador de tablas en Mar del Plata (Taller Puerto Cardiel) y ex instructor nivel 2 de la Asociación de Surf Argentina.',
    status: 'PENDIENTE',
    createdAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
  },
];

function mapRecordToApplication(r: any): VendorApplication {
  const fotosRaw = Array.isArray(r.fotosTablas)
    ? r.fotosTablas
    : typeof r.fotosTablas === 'string'
    ? JSON.parse(r.fotosTablas || '[]')
    : [];
  return {
    id: r.id,
    userId: r.userId,
    userEmail: r.userEmail,
    userNombre: r.userNombre,
    userDni: r.userDni ?? null,
    userTelefono: r.userTelefono ?? null,
    agencyId: r.agencyId ?? null,
    nombreVendedor: r.nombreVendedor,
    descripcion: r.descripcion,
    fotosTablas: fotosRaw.map(String),
    experienciaRubro: r.experienciaRubro,
    status: (r.status as VendorApplicationStatus) || 'PENDIENTE',
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    reviewedAt: r.reviewedAt ? new Date(r.reviewedAt).toISOString() : undefined,
    reviewedBy: r.reviewedBy ?? undefined,
    biometricHash: r.biometricHash ?? undefined,
    motivoResolucion: r.motivoResolucion ?? undefined,
  };
}

class VendorRegistryManager {
  private applications: VendorApplication[];
  private hydratedFromDb = false;

  constructor() {
    this.applications = this.load();
    if (process.env.NODE_ENV !== 'test') {
      void this.hydrateFromDatabase();
    }
  }

  private async hydrateFromDatabase(): Promise<void> {
    try {
      const delegate = (prisma as any)?.vendorApplicationRecord;
      if (!delegate?.findMany) return;

      const rows = await delegate.findMany({ orderBy: { updatedAt: 'desc' } });
      if (Array.isArray(rows) && rows.length > 0) {
        this.applications = rows.map(mapRecordToApplication);
        this.hydratedFromDb = true;
        return;
      }

      for (const app of this.applications) {
        await this.persistOneToDb(app);
      }
      this.hydratedFromDb = true;
    } catch (err) {
      logger.warn('No se pudo hidratar VendorApplicationRecord desde DB', { error: String(err) });
    }
  }

  private async persistOneToDb(app: VendorApplication): Promise<void> {
    if (process.env.NODE_ENV === 'test') return;
    try {
      const delegate = (prisma as any)?.vendorApplicationRecord;
      if (!delegate?.upsert) return;
      await delegate.upsert({
        where: { id: app.id },
        update: {
          userId: app.userId,
          userEmail: app.userEmail,
          userNombre: app.userNombre,
          userDni: app.userDni ?? null,
          userTelefono: app.userTelefono ?? null,
          agencyId: app.agencyId ?? null,
          nombreVendedor: app.nombreVendedor,
          descripcion: app.descripcion,
          fotosTablas: app.fotosTablas,
          experienciaRubro: app.experienciaRubro,
          status: app.status,
          reviewedAt: app.reviewedAt ? new Date(app.reviewedAt) : null,
          reviewedBy: app.reviewedBy ?? null,
          biometricHash: app.biometricHash ?? null,
          motivoResolucion: app.motivoResolucion ?? null,
        },
        create: {
          id: app.id,
          userId: app.userId,
          userEmail: app.userEmail,
          userNombre: app.userNombre,
          userDni: app.userDni ?? null,
          userTelefono: app.userTelefono ?? null,
          agencyId: app.agencyId ?? null,
          nombreVendedor: app.nombreVendedor,
          descripcion: app.descripcion,
          fotosTablas: app.fotosTablas,
          experienciaRubro: app.experienciaRubro,
          status: app.status,
          reviewedAt: app.reviewedAt ? new Date(app.reviewedAt) : null,
          reviewedBy: app.reviewedBy ?? null,
          biometricHash: app.biometricHash ?? null,
          motivoResolucion: app.motivoResolucion ?? null,
        },
      });
    } catch (err) {
      logger.warn('Error al persistir VendorApplicationRecord en DB', { error: String(err) });
    }
  }

  private async deleteOneFromDb(id: string): Promise<void> {
    if (process.env.NODE_ENV === 'test') return;
    try {
      const delegate = (prisma as any)?.vendorApplicationRecord;
      if (!delegate?.deleteMany) return;
      await delegate.deleteMany({ where: { id } });
    } catch (err) {
      logger.warn('Error al eliminar VendorApplicationRecord en DB', { error: String(err) });
    }
  }

  private load(): VendorApplication[] {
    if (this.hydratedFromDb && this.applications.length > 0) {
      return this.applications;
    }
    try {
      if (fs.existsSync(VENDOR_FILE_PATH)) {
        const raw = fs.readFileSync(VENDOR_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      logger.warn('No se pudo leer vendor_applications.json, inicializando semilla', {
        error: String(err),
      });
    }
    return [...INITIAL_SEED_APPLICATIONS];
  }

  private save(list: VendorApplication[] = this.applications): void {
    try {
      const dir = path.dirname(VENDOR_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(VENDOR_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      logger.warn('Error al escribir fallback local vendor_applications.json', {
        error: String(err),
      });
    }
  }

  public getAll(agencyId?: string | null): VendorApplication[] {
    this.applications = this.load();
    const orderWeight: Record<VendorApplicationStatus, number> = {
      PENDIENTE: 0,
      APROBADO: 1,
      RECHAZADO: 2,
    };
    const filtered = agencyId
      ? this.applications.filter((item) => !item.agencyId || item.agencyId === agencyId)
      : this.applications;

    return [...filtered].sort((a, b) => {
      const diff = orderWeight[a.status] - orderWeight[b.status];
      if (diff !== 0) return diff;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  public getById(id: string): VendorApplication | undefined {
    this.applications = this.load();
    return this.applications.find((item) => item.id === id);
  }

  public getByUser(userId: string, userEmail?: string): VendorApplication | undefined {
    this.applications = this.load();
    return this.applications.find(
      (item) =>
        item.userId === userId ||
        (userEmail && item.userEmail.toLowerCase() === userEmail.toLowerCase())
    );
  }

  public ensureOwnerApproved(user: {
    id: string;
    email: string;
    nombre: string;
    dni?: string | null;
    telefono?: string | null;
    agencyId?: string | null;
    fotos?: string[];
  }): VendorApplication {
    const existing = this.getByUser(user.id, user.email);
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const created: VendorApplication = {
      id: randomUUID(),
      userId: user.id,
      userEmail: user.email,
      userNombre: user.nombre,
      userDni: user.dni || null,
      userTelefono: user.telefono || null,
      agencyId: user.agencyId ?? null,
      nombreVendedor: `${user.nombre} • Quiver Oficial`,
      descripcion:
        'Propietario y shaper verificado con flota de tablas habilitadas para alquiler temporal en sede oficial.',
      fotosTablas:
        user.fotos && user.fotos.length > 0
          ? user.fotos
          : ['/images/boards/shortboard-1.jpg'],
      experienciaRubro:
        'Shaper y propietario registrado con historial activo de alquileres e inspecciones técnicas aprobadas.',
      status: 'APROBADO',
      createdAt: now,
      updatedAt: now,
      reviewedAt: now,
      reviewedBy: 'mostrador@surf.com',
      motivoResolucion: 'Habilitación inicial verificada en Sede Central.',
    };

    this.applications.push(created);
    this.save();
    void this.persistOneToDb(created);
    return created;
  }

  public submitApplication(input: {
    userId: string;
    userEmail: string;
    userNombre: string;
    userDni?: string | null;
    userTelefono?: string | null;
    agencyId?: string | null;
    nombreVendedor: string;
    descripcion: string;
    fotosTablas: string[];
    experienciaRubro: string;
  }): VendorApplication {
    this.applications = this.load();
    const now = new Date().toISOString();
    const existingIndex = this.applications.findIndex(
      (item) =>
        item.userId === input.userId ||
        item.userEmail.toLowerCase() === input.userEmail.toLowerCase()
    );

    const fotosLimpias = (input.fotosTablas || [])
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    if (existingIndex >= 0) {
      const prev = this.applications[existingIndex]!;
      const updated: VendorApplication = {
        ...prev,
        userId: input.userId,
        userEmail: input.userEmail,
        userNombre: input.userNombre,
        userDni: input.userDni ?? prev.userDni ?? null,
        userTelefono: input.userTelefono ?? prev.userTelefono ?? null,
        agencyId: input.agencyId ?? prev.agencyId ?? null,
        nombreVendedor: input.nombreVendedor.trim(),
        descripcion: input.descripcion.trim(),
        fotosTablas: fotosLimpias,
        experienciaRubro: input.experienciaRubro.trim(),
        status: prev.status === 'APROBADO' ? 'APROBADO' : 'PENDIENTE',
        updatedAt: now,
      };
      this.applications[existingIndex] = updated;
      this.save();
      void this.persistOneToDb(updated);
      return updated;
    }

    const created: VendorApplication = {
      id: randomUUID(),
      userId: input.userId,
      userEmail: input.userEmail,
      userNombre: input.userNombre,
      userDni: input.userDni || null,
      userTelefono: input.userTelefono || null,
      agencyId: input.agencyId || null,
      nombreVendedor: input.nombreVendedor.trim(),
      descripcion: input.descripcion.trim(),
      fotosTablas: fotosLimpias,
      experienciaRubro: input.experienciaRubro.trim(),
      status: 'PENDIENTE',
      createdAt: now,
      updatedAt: now,
    };

    this.applications.unshift(created);
    this.save();
    void this.persistOneToDb(created);
    return created;
  }

  public resolveApplication(
    id: string,
    params: {
      decision: 'APROBADO' | 'RECHAZADO';
      reviewedBy: string;
      biometricHash: string;
      motivoResolucion?: string;
    }
  ): VendorApplication | null {
    this.applications = this.load();
    const idx = this.applications.findIndex((item) => item.id === id);
    if (idx === -1) return null;

    const current = this.applications[idx];
    if (!current) return null;

    const now = new Date().toISOString();
    const updated: VendorApplication = {
      ...current,
      status: params.decision,
      updatedAt: now,
      reviewedAt: now,
      reviewedBy: params.reviewedBy,
      biometricHash: params.biometricHash,
      motivoResolucion:
        params.motivoResolucion?.trim() ||
        (params.decision === 'APROBADO'
          ? 'Perfil de vendedor verificado y habilitado por la Agencia.'
          : 'Solicitud rechazada tras evaluación en Sede.'),
    };

    this.applications[idx] = updated;
    this.save();
    void this.persistOneToDb(updated);
    return updated;
  }

  public removeApplication(id: string): VendorApplication | null {
    this.applications = this.load();
    const idx = this.applications.findIndex((item) => item.id === id);
    if (idx === -1) return null;

    const removed = this.applications[idx] || null;
    this.applications.splice(idx, 1);
    this.save();
    void this.deleteOneFromDb(id);
    return removed;
  }
}

export const vendorRegistry = new VendorRegistryManager();
