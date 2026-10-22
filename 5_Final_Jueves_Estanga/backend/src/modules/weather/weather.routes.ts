import { Router } from 'express';
import { getMarineForecast } from './weather.controller';

const router = Router();

router.get('/marine', getMarineForecast);

export default router;
