export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  horaIngreso: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  source?: string;
  user?: User;
}

export interface BienvenidaCardProps {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  horaIngreso: string;
  onLogout: () => void;
}
