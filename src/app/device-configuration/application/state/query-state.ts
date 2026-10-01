import { computed, DestroyRef, inject, signal } from '@angular/core';
import { AppHttpError } from '../../../core/http/api-client';
import { getErrorMessage } from '../../../shared/utils/error-message';
export type QueryStatus =
  | 'initial'
  | 'loading'
  | 'refreshing'
  | 'success'
  | 'offline'
  | 'forbidden'
  | 'notFound'
  | 'failure';
/** Conserva datos al refrescar; cancela consultas reemplazadas y al abandonar la página. */
export class QueryState<T> {
  readonly data = signal<T | null>(null);
  readonly status = signal<QueryStatus>('initial');
  readonly error = signal<string | null>(null);
  readonly loading = computed(() => this.status() === 'loading' || this.status() === 'refreshing');
  private controller?: AbortController;
  constructor() {
    inject(DestroyRef).onDestroy(() => this.controller?.abort());
  }
  async load(loader: (signal: AbortSignal) => Promise<T>): Promise<void> {
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    this.status.set(this.data() ? 'refreshing' : 'loading');
    this.error.set(null);
    try {
      const data = await loader(controller.signal);
      if (controller.signal.aborted) return;
      this.data.set(data);
      this.status.set('success');
    } catch (error: unknown) {
      if (controller.signal.aborted) return;
      const code = error instanceof AppHttpError ? error.statusCode : -1;
      if (code === 403 || code === 404) this.data.set(null);
      this.status.set(
        code === 0 ? 'offline' : code === 403 ? 'forbidden' : code === 404 ? 'notFound' : 'failure',
      );
      this.error.set(getErrorMessage(error, 'No se pudo cargar la información.'));
    }
  }
}
