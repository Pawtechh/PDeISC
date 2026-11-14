import { Role } from '@prisma/client';

export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
  agencyId?: string | null;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  nombre: string;
  agencyId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
