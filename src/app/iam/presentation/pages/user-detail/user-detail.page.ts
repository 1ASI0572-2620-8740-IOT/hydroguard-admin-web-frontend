import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ConfirmationDialogComponent } from '../../../../shared/presentation/confirmation-dialog/confirmation-dialog.component';
import { getErrorMessage } from '../../../../shared/utils/error-message';
import { DeactivateOperatorAccountUseCase } from '../../../application/use-cases/deactivate-operator-account.use-case';
import {
  GetOperatorAccountDetailUseCase,
  OperatorAccountDetailResult,
} from '../../../application/use-cases/get-operator-account-detail.use-case';

@Component({
  selector: 'hg-user-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './user-detail.page.html',
  styleUrl: './user-detail.page.css',
})
export class UserDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly getDetailUseCase = inject(GetOperatorAccountDetailUseCase);
  private readonly deactivateUseCase = inject(DeactivateOperatorAccountUseCase);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly detail = signal<OperatorAccountDetailResult | null>(null);
  userId = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.userId = params.get('userId') || '';
      if (this.userId) {
        this.loadDetail();
      } else {
        this.errorMessage.set('No se especificó el ID del usuario.');
        this.loading.set(false);
      }
    });
  }

  async loadDetail(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const result = await this.getDetailUseCase.execute(this.userId);
      this.detail.set(result);
    } catch (error: unknown) {
      this.errorMessage.set(
        getErrorMessage(error, 'Error al obtener el detalle de la cuenta del operario.'),
      );
    } finally {
      this.loading.set(false);
    }
  }

  async onDeactivate(): Promise<void> {
    const confirmed = await firstValueFrom(
      this.dialog
        .open(ConfirmationDialogComponent, {
          data: {
            title: 'Desactivar cuenta',
            message:
              'El operario no podrá acceder al sistema. La cuenta se conservará para trazabilidad.',
            confirmLabel: 'Desactivar',
          },
        })
        .afterClosed(),
    );
    if (!confirmed) return;

    try {
      await this.deactivateUseCase.execute(this.userId);
      await this.loadDetail();
      this.snackBar.open('Cuenta desactivada correctamente.', 'Cerrar', { duration: 3500 });
    } catch (error: unknown) {
      this.snackBar.open(getErrorMessage(error, 'No se pudo desactivar la cuenta.'), 'Cerrar', {
        duration: 5000,
      });
    }
  }

  onGoToFirstAccess(): void {
    this.router.navigate(['/users', this.userId, 'first-access']);
  }

  onBack(): void {
    this.router.navigate(['/users']);
  }
}
