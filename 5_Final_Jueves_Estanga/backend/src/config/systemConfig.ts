import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export interface SystemConfigData {
  agencyCommissionPercent: number; // Porcentaje que cobra la agencia (ej: 5 para 5%)
  updatedAt: string;
  updatedBy?: string;
}

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
    try {
      const dir = path.dirname(CONFIG_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (err) {
      logger.error('Error al persistir system_config.json', { error: String(err) });
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
   * Actualiza el porcentaje de comisión y lo persiste en disco
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
   * Valida la contraseña especial de seguridad requerida para modificar la comisión
   */
  public validateSpecialPassword(password: string): boolean {
    if (!password || typeof password !== 'string') return false;
    const trimmed = password.trim();

    // Contraseña configurada en .env o claves maestras autorizadas de la sede
    const envPassword = process.env.AGENCY_COMMISSION_PASSWORD;
    const authorizedPasswords = [
      envPassword,
      'surf2026',
      'SURF2026',
      'admin1234',
      'Password123!',
      'mdp2026',
    ].filter(Boolean) as string[];

    return authorizedPasswords.includes(trimmed);
  }
}

export const systemConfig = new SystemConfigManager();
