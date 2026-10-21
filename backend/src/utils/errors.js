class AppError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

const badRequest = (message, details) => new AppError(400, 'bad_request', message, details);
const unauthorized = (message = 'Autenticacao obrigatoria.') => new AppError(401, 'unauthorized', message);
const forbidden = (message = 'Acesso negado.') => new AppError(403, 'forbidden', message);
const notFound = (message = 'Recurso nao encontrado.') => new AppError(404, 'not_found', message);
const conflict = (message, details) => new AppError(409, 'conflict', message, details);

module.exports = { AppError, badRequest, unauthorized, forbidden, notFound, conflict };
