import api from "@/services/api";
import type { AuthUser } from "@/store/auth.store";

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  firstName: string;
  lastName: string;
  phone?: string;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", payload);
  return data;
}

/** Extrae el mensaje de error del backend: { error: { message, details } } */
export function getApiErrorMessage(err: unknown, fallback = "Ocurrió un error inesperado"): string {
  const errorObj = (err as {
    response?: {
      data?: {
        error?: {
          message?: string;
          details?: Array<{ path?: string; message: string }>;
        };
      };
    };
  })?.response?.data?.error;

  if (errorObj?.details && errorObj.details.length > 0) {
    const detailsStr = errorObj.details
      .map((d) => (d.path ? `${d.path}: ${d.message}` : d.message))
      .join(", ");
    return `${errorObj.message ?? "Datos inválidos"}: ${detailsStr}`;
  }

  return errorObj?.message ?? fallback;
}
