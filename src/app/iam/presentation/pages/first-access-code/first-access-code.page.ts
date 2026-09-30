import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ConfirmationDialogComponent } from '../../../../shared/presentation/confirmation-dialog/confirmation-dialog.component';
import { getErrorMessage } from '../../../../shared/utils/error-message';
import { GenerateFirstAccessCodeUseCase } from '../../../application/use-cases/generate-first-access-code.use-case';
import { GetFirstAccessCodeUseCase } from '../../../application/use-cases/get-first-access-code.use-case';
import {
  GetOperatorAccountDetailUseCase,
  OperatorAccountDetailResult,
} from '../../../application/use-cases/get-operator-account-detail.use-case';
import { RevokeFirstAccessCodeUseCase } from '../../../application/use-cases/revoke-first-access-code.use-case';
import { FirstAccessCode } from '../../../domain/models/first-access-code';

@Component({
  selector: 'hg-first-access-code-page',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './first-access-code.page.html',
  styleUrl: './first-access-code.page.css',
})
export class FirstAccessCodePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly getFirstAccessCodeUseCase = inject(GetFirstAccessCodeUseCase);
  private readonly getDetailUseCase = inject(GetOperatorAccountDetailUseCase);
  private readonly generateCodeUseCase = inject(GenerateFirstAccessCodeUseCase);
  private readonly revokeCodeUseCase = inject(RevokeFirstAccessCodeUseCase);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly detail = signal<OperatorAccountDetailResult | null>(null);
  readonly code = signal<FirstAccessCode | null>(null);
  readonly copied = signal(false);

  userId = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.userId = params.get('userId') || '';
      if (this.userId) {
        this.loadData();
      } else {
        this.errorMessage.set('Identificador de usuario no proporcionado.');
        this.loading.set(false);
      }
    });
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.copied.set(false);

    try {
      const detailResult = await this.getDetailUseCase.execute(this.userId);
      this.detail.set(detailResult);

      const codeResult = await this.getFirstAccessCodeUseCase.execute(
        this.userId,
        detailResult.accessSummary.operatorProfileId || undefined,
      );
      this.code.set(codeResult);
    } catch (error: unknown) {
      this.errorMessage.set(
        getErrorMessage(error, 'Error al cargar los datos del código de primer acceso.'),
      );
    } finally {
      this.loading.set(false);
    }
  }

  async onGenerateCode(): Promise<void> {
    this.submitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const generated = await this.generateCodeUseCase.execute(this.userId);
      this.code.set(generated);
      this.successMessage.set(
        'Código de primer acceso generado exitosamente. Entréguelo al operario por el medio adecuado.',
      );
    } catch (error: unknown) {
      this.errorMessage.set(getErrorMessage(error, 'No se pudo generar el código.'));
    } finally {
      this.submitting.set(false);
    }
  }

  async onRevokeCode(): Promise<void> {
    const current = this.code();
    if (!current) return;

    const confirmed = await firstValueFrom(
      this.dialog
        .open(ConfirmationDialogComponent, {
          data: {
            title: 'Revocar código',
            message:
              'El código dejará de funcionar de inmediato. Después podrá generar un reemplazo.',
            confirmLabel: 'Revocar',
          },
        })
        .afterClosed(),
    );
    if (!confirmed) return;

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.revokeCodeUseCase.execute(current);
      this.successMessage.set(
        'El código ha sido revocado. Ahora puede generar un código de reemplazo si lo desea.',
      );
      await this.loadData();
    } catch (error: unknown) {
      this.errorMessage.set(getErrorMessage(error, 'No se pudo revocar el código.'));
    } finally {
      this.submitting.set(false);
    }
  }

  async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2500);
    } catch {
      this.errorMessage.set('No se pudo copiar el código al portapapeles.');
    }
  }

  onBack(): void {
    this.router.navigate(['/users', this.userId]);
  }
}
