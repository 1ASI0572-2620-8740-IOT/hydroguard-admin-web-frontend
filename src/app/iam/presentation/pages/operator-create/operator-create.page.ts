import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { getErrorMessage } from '../../../../shared/utils/error-message';
import { CreateOperatorAccountUseCase } from '../../../application/use-cases/create-operator-account.use-case';
import { CreateOperatorRequest } from '../../../domain/models/create-operator.request';

@Component({
  selector: 'hg-operator-create-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './operator-create.page.html',
  styleUrl: './operator-create.page.css',
})
export class OperatorCreatePage {
  private readonly fb = inject(FormBuilder);
  private readonly createOperatorUseCase = inject(CreateOperatorAccountUseCase);
  private readonly router = inject(Router);

  readonly operatorForm: FormGroup = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(3)]],
    identifier: [
      '',
      [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-zA-Z0-9._-]+$/)],
    ],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly hidePassword = signal(true);

  togglePasswordVisibility(): void {
    this.hidePassword.update((val) => !val);
  }

  async onSubmit(): Promise<void> {
    if (this.operatorForm.invalid || this.loading()) {
      this.operatorForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { displayName, identifier, password } = this.operatorForm.value;

    try {
      const created = await this.createOperatorUseCase.execute(
        new CreateOperatorRequest(displayName, identifier, password),
      );

      await this.router.navigate(['/users', created.id]);
    } catch (error: unknown) {
      this.errorMessage.set(
        getErrorMessage(
          error,
          'Error al crear la cuenta de operario. Verifique los datos ingresados.',
        ),
      );
    } finally {
      this.loading.set(false);
    }
  }

  onCancel(): void {
    this.router.navigate(['/users']);
  }
}
