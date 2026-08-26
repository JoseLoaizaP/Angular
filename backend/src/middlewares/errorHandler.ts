import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

/** Middleware final para rutas no registradas: responde 404 en vez de colgar la petición. */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
};

/**
 * Middleware de error centralizado (debe registrarse último, con 4 parámetros para que
 * Express lo reconozca como tal). Los AppError controlados devuelven su statusCode y
 * mensaje tal cual; cualquier otro error se registra en consola y responde 500 genérico
 * para no filtrar detalles internos al cliente.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
};
