import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';

export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

const BUCKET = env.SUPABASE_BUCKET;

let client: SupabaseClient | null = null;

/** Cliente creado de forma perezosa: la app arranca (y los tests corren) sin credenciales de Storage. */
const getClient = (): SupabaseClient => {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new AppError(503, 'Almacenamiento de imágenes no configurado', 'STORAGE_NOT_CONFIGURED');
  }
  client ??= createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Node < 22 no trae WebSocket nativo; Realtime no se usa pero el cliente lo exige al construirse.
    realtime: { transport: ws as unknown as typeof WebSocket },
  });
  return client;
};

/** Detecta el tipo real mirando los primeros bytes (el mimetype del cliente se puede falsificar). */
const detectImageType = (buf: Buffer): { contentType: string; ext: string } | null => {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { contentType: 'image/jpeg', ext: 'jpg' };
  }
  if (buf.length >= 4 && buf.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) {
    return { contentType: 'image/png', ext: 'png' };
  }
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { contentType: 'image/webp', ext: 'webp' };
  }
  return null;
};

export const supabaseStorageService = {
  /** Sube el buffer al bucket público y devuelve la URL pública. */
  async uploadImage(file: UploadedFile): Promise<string> {
    const type = detectImageType(file.buffer);
    if (!type) throw AppError.badRequest('El archivo no es una imagen válida', 'INVALID_IMAGE');

    const supabase = getClient();
    const path = `${randomUUID()}.${type.ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file.buffer, { contentType: type.contentType, upsert: false });

    if (error) {
      console.error('Error subiendo imagen a Supabase Storage:', error);
      throw new AppError(502, 'No se pudo subir la imagen', 'STORAGE_UPLOAD_FAILED');
    }

    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  },

  /** Borra una imagen a partir de su URL pública. Nunca lanza: es limpieza "best effort". */
  async deleteByUrl(url: string | null | undefined): Promise<void> {
    if (!url) return;
    try {
      const marker = `/object/public/${BUCKET}/`;
      const idx = url.indexOf(marker);
      if (idx === -1) return;
      const path = decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
      await getClient().storage.from(BUCKET).remove([path]);
    } catch (err) {
      console.error('No se pudo borrar la imagen de Storage:', err);
    }
  },
};
