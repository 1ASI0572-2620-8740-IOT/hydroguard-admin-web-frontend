import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { environment } from '../../../environments/environment';

export class AppHttpError extends Error {
  constructor(
    public readonly statusCode: number,
    override readonly message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppHttpError';
  }
}

export const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: environment.apiUrl,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      try {
        const rawSession = sessionStorage.getItem('hg_admin_session');
        if (rawSession) {
          const parsed: unknown = JSON.parse(rawSession);
          if (
            parsed &&
            typeof parsed === 'object' &&
            'token' in parsed &&
            typeof parsed.token === 'string' &&
            parsed.token
          ) {
            config.headers.Authorization = `Bearer ${parsed.token}`;
          }
        }
      } catch {}

      if (!config.headers['X-Correlation-Id']) {
        const correlationId = `web-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        config.headers['X-Correlation-Id'] = correlationId;
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ message?: string; error?: string; errors?: unknown }>) => {
      if (!error.response) {
        throw new AppHttpError(
          0,
          'No se pudo conectar con el servidor. Verifique su conexión de red o el estado del servicio.',
        );
      }

      const status = error.response.status;
      const data = error.response.data;
      const message = data?.message || data?.error || error.message || 'Error en la solicitud HTTP';

      switch (status) {
        case 401:
          throw new AppHttpError(401, message, data);
        case 403:
          throw new AppHttpError(
            403,
            'Acceso denegado: No posee los permisos necesarios para realizar esta acción.',
            data,
          );
        case 404:
          throw new AppHttpError(
            404,
            'El recurso solicitado no fue encontrado o ha sido eliminado.',
            data,
          );
        case 409:
          throw new AppHttpError(409, `Conflicto en la operación: ${message}`, data);
        case 422:
          throw new AppHttpError(422, `Error de validación: ${message}`, data?.errors || data);
        default:
          if (status >= 500) {
            throw new AppHttpError(
              status,
              'Error interno del servidor. Por favor, intente más tarde.',
              data,
            );
          }
          throw new AppHttpError(status, message, data);
      }
    },
  );

  return client;
};

export const apiClient: AxiosInstance = createApiClient();
