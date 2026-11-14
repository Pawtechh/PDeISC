import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';
import { logger } from '../utils/logger';

export interface SystemConfigData {
  agencyCommissionPercent: number; // Porcentaje que cobra la agencia (ej: 5 para 5%)
  updatedAt: string;
  updatedBy?: string;
}

const SETTING_KEY = 'agency_commission';
const CONFIG_FILE_PATH = path.resolve(__dirname, '../../data/system_config.json');

const DEFAULT_CONFIG: SystemConfigData = {
  agencyCommissionPercent: 5,
  updatedAt: new Date().toISOString(),
  updatedBy: 'system_default',
};

class SystemConfigManager {
  private config: SystemConfigData;

  constructor() {
    this.config = this.loadConfig();
    if (process.env.NODE_ENV !== 'test') {
      void this.hydrateFromDatabase();
    }
  }

  private async hydrateFromDatabase(): Promise<void> {
    try {
      const delegate = (prisma as any)?.systemSetting;
      if (!delegate?.findUnique) return;
      const row = await delegate.findUnique({ where: { key: SETTING_KEY } });
      if (row?.value && typeof row.value === 'object') {
        const val = row.value as Partial<SystemConfigData>;
        if (typeof val.agencyCommissionPercent === 'number' && !isNaN(val.agencyCommissionPercent)) {
          this.config = {
            agencyCommissionPercent: val.agencyCommissionPercent,
            updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
            updatedBy: row.updatedBy || val.updatedBy || 'db_persisted',
          };
          return;
        }
      }
      // Si aún no existía en DB, sembrar el valor actual en SystemSetting
      await delegate.upsert?.({
        where: { key: SETTING_KEY },
        update: {},
        create: {
          key: SETTING_KEY,
          value: this.config,
          updatedBy: this.config.updatedBy || 'system_seed',
        },
      });
    } catch (err) {
      logger.warn('No se pudo hidratar SystemSetting desde DB, operando con fallback', {
        error: String(err),
      });
    }
  }

  private async persistToDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'test') return;
    try {
      const delegate = (prisma as any)?.systemSetting;
      if (!delegate?.upsert) return;
      await delegate.upsert({
        where: { key: SETTING_KEY },
        update: {
          value: this.config,
          updatedBy: this.config.updatedBy || 'web_operator',
        },
        create: {
          key: SETTING_KEY,
          value: this.config,
          updatedBy: this.config.updatedBy || 'web_operator',
        },
      });
    } catch (err) {
      logger.warn('Error al persistir SystemSetting en DB', { error: String(err) });
    }
  }

  private loadConfig(): SystemConfigData {
    try {
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        const raw = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (typeof parsed.agencyCommissionPercent === 'number' && !isNaN(parsed.agencyCommissionPercent)) {
          return {
            agencyCommissionPercent: parsed.agencyCommissionPercent,
            updatedAt: parsed.updatedAt || new Date().toISOString(),
            updatedBy: parsed.updatedBy || 'persisted_config',
          };
        }
      }
    } catch (err) {
      logger.warn('No se pudo leer el archivo system_config.json, usando valores por defecto', {
        error: String(err),
      });
    }
    return { ...DEFAULT_CONFIG };
  }

  private saveConfig(): void {
    void this.persistToDatabase();
    try {
      const dir = path.dirname(CONFIG_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (err) {
      logger.warn('Error al persistir system_config.json en disco', { error: String(err) });
    }
  }

  /**
   * Obtiene el porcentaje de comisión de la agencia como número entero o flotante (ej: 5 para 5%)
   */
  public getAgencyCommissionPercentage(): number {
    return this.config.agencyCommissionPercent;
  }

  /**
   * Obtiene la tasa de comisión de la agencia en decimal (ej: 0.05 para 5%)
   */
  public getAgencyCommissionRate(): number {
    return this.config.agencyCommissionPercent / 100;
  }

  /**
   * Obtiene el porcentaje correspondiente a los owners (ej: 95 para 95%)
   */
  public getOwnerCommissionPercentage(): number {
    return Math.max(0, 100 - this.config.agencyCommissionPercent);
  }

  /**
   * Obtiene la tasa correspondiente a los owners en decimal (ej: 0.95 para 95%)
   */
  public getOwnerCommissionRate(): number {
    return Math.max(0, 100 - this.config.agencyCommissionPercent) / 100;
  }

  /**
   * Actualiza el porcentaje de comisión y lo persiste en PostgreSQL/MySQL + respaldo local
   */
  public setAgencyCommissionPercent(percent: number, updatedBy?: string): void {
    this.config = {
      agencyCommissionPercent: percent,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || 'web_operator',
    };
    this.saveConfig();
  }

  /**
   * Valida la contraseña especial de seguridad requerida para modificar la comisión.
   * En producción exige AGENCY_COMMISSION_PASSWORD configurada en entorno (sin claves demo).
   */
  public validateSpecialPassword(password: string): boolean {
    if (!password || typeof password !== 'string') return false;
    const trimmed = password.trim();

    const envPassword = process.env.AGENCY_COMMISSION_PASSWORD?.trim();
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      if (!envPassword) {
        logger.error('AGENCY_COMMISSION_PASSWORD no configurada en producción; acción denegada.');
        return false;
      }
      return trimmed === envPassword;
    }

    const devFallbacks =
      process.env.ALLOW_DEMO_ADMIN_PASSWORDS === 'false'
        ? []
        : ['surf2026', 'SURF2026', 'admin1234', 'Password123!', 'mdp2026'];

    const authorizedPasswords = [envPassword, ...devFallbacks].filter(Boolean) as string[];
    return authorizedPasswords.includes(trimmed);
  }
}

export const systemConfig = new SystemConfigManager();
