export interface ConfigurationVersion {
  readonly id: string;
  readonly deviceId: string;
  readonly configurationVersion: number;
  readonly status: 'DRAFT' | 'PUBLISHED';
  readonly compatible: boolean;
  readonly incompatibilityReasons: ReadonlyArray<string>;
  readonly createdAt: string;
  readonly publishedAt: string | null;
  readonly phMin: number;
  readonly phMax: number;
  readonly temperatureMin: number;
  readonly temperatureMax: number;
  readonly releaseMode: 'MANUAL' | 'AUTOMATIC';
}
