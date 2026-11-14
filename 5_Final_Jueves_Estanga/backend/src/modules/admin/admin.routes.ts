import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth';
import { requireRole } from '../../middlewares/requireRole';
import { validateBody } from '../../middlewares/validateBody';
import {
  adminCreateAgencySchema,
  adminCreateBoardSchema,
  adminUpdateAgencySchema,
  createAgencyOperatorSchema,
  createZoneSchema,
  relocateBoardSchema,
  updateUserRoleAdminSchema,
  updateZoneSchema,
} from './admin.schemas';
import {
  createAgencyAdmin,
  createAgencyOperatorAdmin,
  createBoardInLocationAdmin,
  createZoneAdmin,
  deleteZoneAdmin,
  getAdminOverview,
  relocateBoardAdmin,
  updateAgencyAdmin,
  updateUserRoleAdmin,
  updateZoneAdmin,
} from './admin.controller';

const router = Router();

// Todas las rutas del módulo maestro exigen rol SUPER_ADMIN autenticado
router.use(requireAuth, requireRole('SUPER_ADMIN'));

router.get('/overview', getAdminOverview);

// Gestión de Zonas / Ciudades / Spots
router.post('/zones', validateBody(createZoneSchema), createZoneAdmin);
router.patch('/zones/:id', validateBody(updateZoneSchema), updateZoneAdmin);
router.delete('/zones/:id', deleteZoneAdmin);

// Gestión de Negocios / Agencias y Cuentas de rango AGENCIA
router.post('/agencies', validateBody(adminCreateAgencySchema), createAgencyAdmin);
router.patch('/agencies/:id', validateBody(adminUpdateAgencySchema), updateAgencyAdmin);
router.post('/users/agency-account', validateBody(createAgencyOperatorSchema), createAgencyOperatorAdmin);
router.patch('/users/:id/role', validateBody(updateUserRoleAdminSchema), updateUserRoleAdmin);

// Creación y reubicación de tablas entre locaciones/agencias
router.post('/boards', validateBody(adminCreateBoardSchema), createBoardInLocationAdmin);
router.patch('/boards/:id/location', validateBody(relocateBoardSchema), relocateBoardAdmin);

export default router;
