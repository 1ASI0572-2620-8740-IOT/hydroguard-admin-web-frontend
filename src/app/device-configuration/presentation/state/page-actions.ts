import { inject, Injectable, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { AppHttpError } from '../../../core/http/api-client';
import { ConfirmationDialogComponent } from '../../../shared/presentation/confirmation-dialog/confirmation-dialog.component';
import { getErrorMessage } from '../../../shared/utils/error-message';
@Injectable()
export class PageActions {
  private readonly dialog = inject(MatDialog);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  async run(
    label: string,
    command: () => Promise<unknown>,
    refresh?: () => Promise<void>,
    confirmation?: string,
    form?: AbstractControl,
    refreshAfterSuccess = true,
  ): Promise<void> {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.error.set(null);
    this.success.set(null);
    try {
      if (confirmation) {
        const confirmed = await firstValueFrom(
          this.dialog
            .open(ConfirmationDialogComponent, {
              data: { title: label, message: confirmation, confirmLabel: 'Confirmar' },
            })
            .afterClosed(),
        );
        if (!confirmed) return;
      }
      await command();
      this.success.set(label + ': operación completada.');
      if (refreshAfterSuccess) await refresh?.();
    } catch (error: unknown) {
      this.error.set(getErrorMessage(error, 'No se pudo completar la operación.'));
      if (
        error instanceof AppHttpError &&
        error.statusCode === 422 &&
        form &&
        error.details &&
        typeof error.details === 'object'
      ) {
        for (const [key, value] of Object.entries(error.details)) {
          if (typeof value === 'string') form.get(key)?.setErrors({ server: value });
        }
      }
      if (error instanceof AppHttpError && error.statusCode === 409) await refresh?.();
    } finally {
      this.submitting.set(false);
    }
  }
}
