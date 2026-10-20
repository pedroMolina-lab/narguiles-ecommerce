import type { RequestHandler } from 'express';
import multer from 'multer';
import { AppError } from '../utils/AppError';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
    cb(AppError.badRequest('Solo se permiten imágenes JPG, PNG o WebP', 'INVALID_IMAGE_TYPE'));
  },
});

/** Recibe un campo multipart "image" en memoria (req.file) y traduce errores de multer a AppError. */
export const uploadProductImage: RequestHandler = (req, res, next) => {
  uploader.single('image')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'La imagen supera el máximo de 5 MB'
          : 'Archivo inválido: usa un único campo "image"';
      return next(AppError.badRequest(message, 'UPLOAD_ERROR'));
    }
    next(err);
  });
};
