export interface Page<T> {
  readonly items: ReadonlyArray<T>;
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}
export interface ListQuery {
  readonly searchTerm?: string;
  readonly status?: string;
  readonly page?: number;
  readonly pageSize?: number;
  readonly sortBy?: string;
  readonly sortDirection?: 'asc' | 'desc';
}
export interface DeviceQuery extends ListQuery {
  readonly availability?: string;
  readonly operatingEnvironment?: string;
  readonly configurationStatus?: string;
}
