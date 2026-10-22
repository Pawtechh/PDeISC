import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth';
import {
  listDocuments,
  getDocument,
  signDocument,
  signBiometric,
  verifySignature,
  getAuditCertificate,
  getRentalContract,
} from './legal.controller';

const router = Router();

// Rutas Públicas (Auditoría, Verificación y Consulta de Términos)
router.get('/documents', listDocuments);
router.get('/documents/:slug', getDocument);
router.get('/verify/:auditToken', verifySignature);
router.get('/audit/:id', getAuditCertificate);

// Rutas Autenticadas (Firma y Generación de Contratos)
router.post('/sign', requireAuth, signDocument);
router.post('/sign-biometric', requireAuth, signBiometric);
router.get('/rental/:rentalId/contract', requireAuth, getRentalContract);

export default router;
