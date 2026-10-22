import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { logger } from './utils/logger';

const app = createApp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`🌊 Surf Rental Backend corriendo en puerto ${PORT}`);
  logger.info(`📄 Documentación Swagger disponible en: http://localhost:${PORT}/api-docs`);
});
