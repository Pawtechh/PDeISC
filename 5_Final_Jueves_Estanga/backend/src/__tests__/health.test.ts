import request from 'supertest';
import { createApp } from '../app';

describe('Health Check API', () => {
  const app = createApp();

  it('should return 200 OK and status ok on GET /api/health', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('service', 'surf-rental-backend');
    expect(response.body).toHaveProperty('timestamp');
  });
});
