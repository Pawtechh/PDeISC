import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../app';
import { BoardsService } from '../boards.service';
import { prisma } from '../../../config/prisma';
import { BoardStatus, Role } from '@prisma/client';
import { JWT_CONFIG } from '../../../config/jwt';

jest.mock('../../../config/prisma', () => ({
  prisma: {
    board: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Boards Module Tests', () => {
  let boardsService: BoardsService;
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
    boardsService = new BoardsService();
  });

  const validBoardInput = {
    titulo: 'UVA Classic Nose Rider 9\'2',
    marca: 'UVA',
    modelo: 'Classic Nose Rider',
    medidas: '9\'2 x 23 x 3',
    volumenLitros: 75.5,
    tipoTabla: 'Longboard' as const,
    precioHora: 4500,
    valorTasadoUsd: 450,
    fotos: ['https://images.unsplash.com/board1.jpg'],
  };

  describe('BoardsService Logic & Business Rules', () => {
    it('should create board and schedule maintenance in 45 days', async () => {
      (prisma.board.findFirst as jest.Mock).mockResolvedValue(null); // no duplicate
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'owner-1',
        createdAt: new Date(),
      });

      const mockCreated = {
        id: 'board-1',
        ownerId: 'owner-1',
        ...validBoardInput,
        estado: BoardStatus.DISPONIBLE,
        proximoMantenimiento: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      };
      (prisma.board.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await boardsService.create('owner-1', validBoardInput);

      expect(prisma.board.findFirst).toHaveBeenCalledWith({
        where: {
          ownerId: 'owner-1',
          marca: { equals: 'UVA' },
          modelo: { equals: 'Classic Nose Rider' },
          medidas: { equals: '9\'2 x 23 x 3' },
        },
      });
      expect(result.id).toBe('board-1');
      expect(prisma.board.create).toHaveBeenCalled();
    });

    it('should reject duplicate board with 409 DUPLICATE_BOARD', async () => {
      (prisma.board.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-board-id',
        marca: 'UVA',
        modelo: 'Classic Nose Rider',
      });

      await expect(
        boardsService.create('owner-1', validBoardInput)
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'DUPLICATE_BOARD',
      });
    });

    it('should return paginated catalog with calculated average rating', async () => {
      const mockBoards = [
        {
          id: 'board-1',
          titulo: 'Longboard 9\'2',
          precioHora: 4500,
          reviews: [{ calificacion: 5 }, { calificacion: 4 }],
          owner: { id: 'owner-1', nombre: 'Shaper MDP' },
        },
      ];
      (prisma.board.findMany as jest.Mock).mockResolvedValue(mockBoards);
      (prisma.board.count as jest.Mock).mockResolvedValue(1);

      const result = await boardsService.getAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]!.calificacionPromedio).toBe(4.5);
      expect(result.meta.total).toBe(1);
    });

    it('should return 7-day availability slots for a board', async () => {
      (prisma.board.findUnique as jest.Mock).mockResolvedValue({
        id: 'board-1',
        estado: BoardStatus.DISPONIBLE,
      });

      const availability = await boardsService.getAvailability('board-1');

      expect(availability.dias).toHaveLength(7);
      expect(availability.dias[0]!.disponible).toBe(true);
      expect(availability.dias[0]!.franjasDisponibles.length).toBeGreaterThan(0);
    });

    it('should prevent non-owners from modifying a board with 403 FORBIDDEN', async () => {
      (prisma.board.findUnique as jest.Mock).mockResolvedValue({
        id: 'board-1',
        ownerId: 'owner-real',
      });

      await expect(
        boardsService.update('other-user', 'OWNER', 'board-1', { titulo: 'Hack' })
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN',
      });
    });
  });

  describe('HTTP Endpoints /api/boards', () => {
    it('should allow public access to GET /api/boards', async () => {
      (prisma.board.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.board.count as jest.Mock).mockResolvedValue(0);

      const res = await request(app).get('/api/boards');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
    });

    it('should deny POST /api/boards to unauthenticated users with 401', async () => {
      const res = await request(app)
        .post('/api/boards')
        .send(validBoardInput);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should deny POST /api/boards to CONSUMER role with 403 FORBIDDEN', async () => {
      const consumerToken = jwt.sign(
        { id: 'consumer-1', email: 'consumer@surf.com', role: Role.CONSUMER },
        JWT_CONFIG.accessSecret
      );

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'consumer-1',
        email: 'consumer@surf.com',
        role: Role.CONSUMER,
        activo: true,
      });

      const res = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send(validBoardInput);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });
});
