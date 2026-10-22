import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../app';
import { prisma } from '../../../config/prisma';
import { JWT_CONFIG } from '../../../config/jwt';
import { LegalService } from '../legal.service';

// Mocks de Prisma
jest.mock('../../../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    digitalSignature: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    rental: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}));

describe('Legal & Digital Signature Audit Module Tests (MP11 13 Documentos, Hashes SHA-256 y Firma Ley 25.506)', () => {
  const app = createApp();

  const mockUser = {
    id: 'user-legal-test-1',
    email: 'surfer.legal@mdp.com',
    nombre: 'Martín Palermo',
    role: 'CONSUMER',
    dni: '33444555',
  };

  const validToken = jwt.sign(
    {
      id: mockUser.id,
      sub: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
    },
    JWT_CONFIG.accessSecret,
    { expiresIn: '1h' }
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: mockUser.id,
      email: mockUser.email,
      nombre: mockUser.nombre,
      role: mockUser.role,
      activo: true,
    });
  });

  describe('1. Catálogo Legal & Hashes Criptográficos - GET /api/legal/documents', () => {
    it('debe listar los 13 documentos legales obligatorios con versiones y hashes SHA-256 de 64 caracteres', async () => {
      const res = await request(app).get('/api/legal/documents');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveLength(13);

      const docs = res.body.data;
      const slugs = docs.map((d: any) => d.slug);

      // Verificamos presencia de los 13 documentos clave
      expect(slugs).toContain('terminos-y-condiciones');
      expect(slugs).toContain('contrato-agencia-owner');
      expect(slugs).toContain('contrato-alquiler-template');
      expect(slugs).toContain('politica-danos');
      expect(slugs).toContain('politica-seguros');
      expect(slugs).toContain('politica-cancelacion');
      expect(slugs).toContain('politica-privacidad');
      expect(slugs).toContain('politica-puntos');
      expect(slugs).toContain('politica-multas');
      expect(slugs).toContain('reglamento-owner');
      expect(slugs).toContain('consentimiento-informado');
      expect(slugs).toContain('autorizacion-debito');
      expect(slugs).toContain('acuerdo-confidencialidad');

      // Verificamos que cada hash SHA-256 sea válido (hex de 64 caracteres)
      for (const doc of docs) {
        expect(doc.version).toBe('1.0');
        expect(doc.sha256Hash).toMatch(/^[a-f0-9]{64}$/);
        expect(doc.fileSizeBytes).toBeGreaterThan(0);
      }
    });

    it('debe obtener el contenido completo de terminos-y-condiciones.md con hash y metadatos', async () => {
      const res = await request(app).get('/api/legal/documents/terminos-y-condiciones');

      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe('terminos-y-condiciones');
      expect(res.body.data.content).toContain('Términos y Condiciones Generales de Uso');
      expect(res.body.data.content).toContain('Ley 25.506');
      expect(res.body.data.content).toContain('Mar del Plata');
      expect(res.body.data.sha256Hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('debe retornar 404 si se solicita un slug inexistente', async () => {
      const res = await request(app).get('/api/legal/documents/documento-que-no-existe');
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('no encontrado');
    });
  });

  describe('2. Verificación de Integridad y Firma Digital - POST /api/legal/sign', () => {
    it('debe rechazar la firma con 401 si no hay token de autenticación', async () => {
      const res = await request(app).post('/api/legal/sign').send({
        documentSlug: 'terminos-y-condiciones',
        documentHash: 'a'.repeat(64),
      });

      expect(res.status).toBe(401);
    });

    it('REGLA CRÍTICA LEY 25.506: debe rechazar con 400 si el hash enviado no coincide con el del servidor (Tamper Detection)', async () => {
      const tamperedHash = 'f'.repeat(64);

      const res = await request(app)
        .post('/api/legal/sign')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          documentSlug: 'terminos-y-condiciones',
          documentHash: tamperedHash,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('DOCUMENT_HASH_MISMATCH');
      expect(res.body.message).toContain('no coincide con el hash del documento oficial');
    });

    it('debe registrar exitosamente la firma digital cuando el hash es íntegro y emitir auditToken', async () => {
      // Obtenemos el hash oficial primero
      const legalService = new LegalService();
      const doc = legalService.getDocumentBySlug('terminos-y-condiciones');

      (prisma.digitalSignature.create as jest.Mock).mockResolvedValue({
        id: 'sig-test-uuid-1',
        userId: mockUser.id,
        documentSlug: 'terminos-y-condiciones',
        documentHash: doc.sha256Hash,
        version: '1.0',
        rentalId: null,
        ipAddress: '190.188.10.55',
        userAgent: 'SurfRentalMobileApp/1.0',
        auditToken: 'SRMDP-AUDIT-TEST12345678',
        verified: true,
        timestamp: new Date(),
      });

      (prisma.notification.create as jest.Mock).mockResolvedValue({
        id: 'notif-1',
      });

      const res = await request(app)
        .post('/api/legal/sign')
        .set('Authorization', `Bearer ${validToken}`)
        .set('User-Agent', 'SurfRentalMobileApp/1.0')
        .send({
          documentSlug: 'terminos-y-condiciones',
          documentHash: doc.sha256Hash,
          signatureData: 'data:image/svg+xml;base64,PHN2Zz5zaWduYXR1cmU8L3N2Zz4=',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.auditToken).toMatch(/^SRMDP-AUDIT-[A-F0-9]+/);
      expect(res.body.data.verified).toBe(true);
      expect(res.body.data.legalFramework).toContain('Ley Nacional 25.506');
      expect(res.body.data.jurisdiction).toContain('Mar del Plata');
    });
  });

  describe('3. Trazabilidad Pública y Verificación de Auditoría - GET /api/legal/verify/:auditToken', () => {
    it('debe verificar la autenticidad e integridad de la firma para un auditToken registrado', async () => {
      const legalService = new LegalService();
      const doc = legalService.getDocumentBySlug('terminos-y-condiciones');

      (prisma.digitalSignature.findUnique as jest.Mock).mockResolvedValue({
        id: 'sig-test-uuid-1',
        userId: mockUser.id,
        documentSlug: 'terminos-y-condiciones',
        documentHash: doc.sha256Hash,
        version: '1.0',
        rentalId: null,
        ipAddress: '190.188.10.55',
        userAgent: 'SurfRentalMobileApp/1.0',
        auditToken: 'SRMDP-AUDIT-TEST12345678',
        verified: true,
        timestamp: new Date('2026-10-10T12:00:00Z'),
      });

      const res = await request(app).get('/api/legal/verify/SRMDP-AUDIT-TEST12345678');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.auditToken).toBe('SRMDP-AUDIT-TEST12345678');
      expect(res.body.data.documentIntegrity).toBe('INTACTO');
      expect(res.body.data.status).toBe('VALIDO_LEY_25506');
      expect(res.body.data.jurisdiction).toBe('Mar del Plata, Argentina');
    });

    it('debe devolver 404 si el auditToken no existe', async () => {
      (prisma.digitalSignature.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get('/api/legal/verify/TOKEN-INEXISTENTE');
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('SIGNATURE_NOT_FOUND');
    });
  });

  describe('4. Certificado Oficial de Auditoría - GET /api/legal/audit/:id', () => {
    it('debe emitir certificado pericial formal con normativa Ley 25.506 y CCyCN', async () => {
      (prisma.digitalSignature.findFirst as jest.Mock).mockResolvedValue({
        id: 'sig-test-uuid-1',
        userId: mockUser.id,
        documentSlug: 'consentimiento-informado',
        documentHash: 'abc123hash',
        version: '1.0',
        rentalId: 'rental-100',
        ipAddress: '181.44.20.10',
        userAgent: 'iPhone/Safari',
        auditToken: 'SRMDP-AUDIT-CERT999',
        timestamp: new Date('2026-10-10T15:30:00Z'),
      });

      const res = await request(app).get('/api/legal/audit/SRMDP-AUDIT-CERT999');

      expect(res.status).toBe(200);
      expect(res.body.data.certificateId).toBe('CERT-SRMDP-AUDIT-CERT999');
      expect(res.body.data.normativa).toContain('Ley 25.506');
      expect(res.body.data.jurisdiction).toContain('Mar del Plata');
      expect(res.body.data.issuer).toContain('Surf Rental Mar del Plata');
    });
  });

  describe('5. Generación Dinámica de Contrato Individual - GET /api/legal/rental/:rentalId/contract', () => {
    it('debe compilar la plantilla de alquiler sustituyendo parámetros del consumer, tabla y cálculo', async () => {
      const mockRental = {
        id: 'rental-contrato-1',
        consumerId: mockUser.id,
        horas: 4,
        precioBase: 24000,
        descuento: 2400,
        precioSeguro: 3000,
        precioTotal: 24600,
        fechaInicio: new Date('2026-10-12T10:00:00Z'),
        fechaFinEstimada: new Date('2026-10-12T14:00:00Z'),
        ipAceptacion: '190.188.10.55',
        consumer: {
          id: mockUser.id,
          nombre: 'Martín Palermo',
          dni: '33444555',
          email: 'surfer.legal@mdp.com',
        },
        board: {
          id: 'board-777',
          marca: 'Channel Islands',
          modelo: 'FishBeard',
          tipoTabla: 'Fish',
          medidas: "5'8 x 19 3/8 x 2 3/8",
          polizaSeguroNumero: 'POL-SURF-9988',
          owner: {
            id: 'owner-1',
            nombre: 'Carlos Shaper',
          },
        },
        payments: [
          {
            id: 'pay-preauth-1',
            tipo: 'PRE_AUTH_DANO',
            monto: 30000,
          },
        ],
      };

      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRental);
      (prisma.rental.update as jest.Mock).mockResolvedValue({
        ...mockRental,
        contratoHash: 'new-hash',
      });

      const res = await request(app)
        .get(`/api/legal/rental/${mockRental.id}/contract`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.rentalId).toBe('rental-contrato-1');
      expect(res.body.data.sha256Hash).toMatch(/^[a-f0-9]{64}$/);

      const contractText = res.body.data.contractMarkdown;
      expect(contractText).toContain('Martín Palermo');
      expect(contractText).toContain('33444555');
      expect(contractText).toContain('Channel Islands');
      expect(contractText).toContain('POL-SURF-9988');
      expect(contractText).toContain('pay-preauth-1');
      expect(contractText).toContain(res.body.data.sha256Hash);
    });
  });

  describe('6. Biometría por Huella Digital - POST /api/legal/sign-biometric y /api/rentals/sign-biometric', () => {
    it('debe registrar y certificar la firma biométrica conforme Ley 25.506 y 25.326 sin almacenar datos biométricos sensibles', async () => {
      (prisma.digitalSignature.create as jest.Mock).mockResolvedValue({
        id: 'sig-bio-123',
        userId: mockUser.id,
        documentSlug: 'contrato-alquiler',
        documentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        version: '1.0',
        rentalId: 'rental-bio-1',
        ipAddress: '190.188.10.55',
        userAgent: 'SurfRentalBiometricClient/1.0',
        auditToken: 'SRMDP-BIOMETRIC-ABCD1234',
        verified: true,
        timestamp: new Date(),
      });

      (prisma.rental.update as jest.Mock).mockResolvedValue({
        id: 'rental-bio-1',
        contratoHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });

      const res = await request(app)
        .post('/api/legal/sign-biometric')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          rental_id: 'rental-bio-1',
          signature_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          biometric_verified: true,
          timestamp: new Date().toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toContain('Ley 25.506 y 25.326');
      expect(res.body.data.auditToken).toMatch(/^SRMDP-BIOMETRIC-[A-F0-9]+/);
      expect(res.body.data.verified).toBe(true);
      expect(res.body.data.documentHash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });

    it('REGLA ANTI-IDOR: debe rechazar con 403 si un usuario intenta firmar biométricamente por otro usuario', async () => {
      const res = await request(app)
        .post('/api/legal/sign-biometric')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          user_id: 'otro-usuario-victima-id',
          signature_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          biometric_verified: true,
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
      expect(res.body.message).toContain('No podés firmar biométricamente en nombre de otro usuario');
    });

    it('debe registrar firma biométrica a través del endpoint de alquileres /api/rentals/sign-biometric', async () => {
      (prisma.digitalSignature.create as jest.Mock).mockResolvedValue({
        id: 'sig-bio-rental-99',
        userId: mockUser.id,
        documentSlug: 'contrato-alquiler',
        documentHash: 'hash-rental-sig-12345',
        version: '1.0',
        rentalId: 'rental-99',
        ipAddress: '190.188.10.55',
        userAgent: 'SurfRentalBiometricClient/1.0',
        auditToken: 'SRMDP-BIOMETRIC-RNT99',
        verified: true,
        timestamp: new Date(),
      });

      const res = await request(app)
        .post('/api/rentals/sign-biometric')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          rental_id: 'rental-99',
          signature_hash: 'hash-rental-sig-12345',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.auditToken).toMatch(/^SRMDP-BIOMETRIC-/);
    });
  });
});
