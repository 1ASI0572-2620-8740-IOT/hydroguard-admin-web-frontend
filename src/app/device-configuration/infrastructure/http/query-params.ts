/** Omite filtros vacíos; el servidor distingue parámetro ausente de un filtro concreto. */
export const queryParams = (query: object): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(query).filter(
      ([, value]) => value !== '' && value !== undefined && value !== null,
    ),
  );
