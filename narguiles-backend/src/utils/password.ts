import { hash, verify } from '@node-rs/argon2';

// Único punto que conoce el algoritmo de hash: cambiar a bcrypt solo afecta este archivo.
// @node-rs/argon2 usa argon2id por defecto y trae binarios precompilados (sin node-gyp).
export const hashPassword = (plain: string): Promise<string> => hash(plain);

export const verifyPassword = async (hashed: string, plain: string): Promise<boolean> => {
  try {
    return await verify(hashed, plain);
  } catch {
    return false;
  }
};
