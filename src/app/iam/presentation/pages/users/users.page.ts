import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ConfirmationDialogComponent } from '../../../../shared/presentation/confirmation-dialog/confirmation-dialog.component';
import { getErrorMessage } from '../../../../shared/utils/error-message';
import { DeactivateOperatorAccountUseCase } from '../../../application/use-cases/deactivate-operator-account.use-case';
import { ListOperatorAccountsUseCase } from '../../../application/use-cases/list-operator-accounts.use-case';
import { OperatorAccount } from '../../../domain/models/operator-account';
import { UsersTableComponent } from '../../components/users-table/users-table.component';

@Component({
  selector: 'hg-users-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    UsersTableComponent,
  ],
  templateUrl: './users.page.html',
  styleUrl: './users.page.css',
})
export class UsersPage implements OnInit {
  private readonly listOperatorsUseCase = inject(ListOperatorAccountsUseCase);
  private readonly deactivateUseCase = inject(DeactivateOperatorAccountUseCase);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly operators = signal<ReadonlyArray<OperatorAccount>>([]);
  readonly total = signal<number>(0);
  readonly pageIndex = signal<number>(0);
  readonly pageSize = signal<number>(10);
  readonly loading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  searchTerm = '';
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';

  ngOnInit(): void {
    this.loadOperators();
  }

  async loadOperators(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const pageResult = await this.listOperatorsUseCase.execute({
        searchTerm: this.searchTerm || undefined,
        status: this.statusFilter === 'ALL' ? undefined : this.statusFilter,
        page: this.pageIndex() + 1,
        pageSize: this.pageSize(),
      });

      this.operators.set(pageResult.items);
      this.total.set(pageResult.total);
    } catch (error: unknown) {
      this.errorMessage.set(getErrorMessage(error, 'Error al cargar el listado de operarios.'));
    } finally {
      this.loading.set(false);
    }
  }

  onSearchChange(): void {
    this.pageIndex.set(0);
    this.loadOperators();
  }

  onStatusFilterChange(): void {
    this.pageIndex.set(0);
    this.loadOperators();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadOperators();
  }

  onUserSelected(operatorId: string): void {
    this.router.navigate(['/users', operatorId]);
  }

  async onDeactivateUser(operatorId: string): Promise<void> {
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
      await this.deactivateUseCase.execute(operatorId);
      await this.loadOperators();
      this.snackBar.open('Cuenta desactivada correctamente.', 'Cerrar', { duration: 3500 });
    } catch (error: unknown) {
      this.snackBar.open(getErrorMessage(error, 'No se pudo desactivar la cuenta.'), 'Cerrar', {
        duration: 5000,
      });
    }
  }

  onManageAccessCode(operatorId: string): void {
    this.router.navigate(['/users', operatorId, 'first-access']);
  }

  onCreateOperator(): void {
    this.router.navigate(['/users/new']);
  }
}
