import { computed, DestroyRef, inject, signal } from '@angular/core';
import { AppHttpError } from '../../../core/http/api-client';
import { getErrorMessage } from '../../../shared/utils/error-message';

export class MonitoringQueryState<T> {
  readonly data = signal<T | null>(null);
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);
  readonly empty = computed(() => !this.loading() && !this.error() && !this.data());
  private controller?: AbortController;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.controller?.abort());
  }

  async load(loader: (signal: AbortSignal) => Promise<T>): Promise<void> {
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    this.loading.set(true);
    this.error.set(null);
    try {
      const value = await loader(controller.signal);
      if (!controller.signal.aborted) this.data.set(value);
    } catch (error: unknown) {
      if (controller.signal.aborted) return;
      if (error instanceof AppHttpError && [403, 404].includes(error.statusCode))
        this.data.set(null);
      this.error.set(getErrorMessage(error, 'No se pudo cargar la información de monitoreo.'));
    } finally {
      if (!controller.signal.aborted) this.loading.set(false);
    }
  }
}
