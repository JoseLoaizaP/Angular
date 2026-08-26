/**
 * Error de negocio con código HTTP asociado. errorHandler lo distingue de errores
 * inesperados y devuelve su statusCode/message directamente al cliente.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
