import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { getErrorMessage } from '../../../../shared/utils/error-message';
import { RegisterOrganizationUseCase } from '../../../application/use-cases/register-organization.use-case';
import {
  OrganizationSegment,
  RegisterOrganizationRequest,
} from '../../../domain/models/register-organization.request';

const passwordsMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmation = control.get('passwordConfirmation')?.value;
  return password && confirmation && password !== confirmation ? { passwordsMismatch: true } : null;
};

@Component({
  selector: 'hg-administrator-register-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './administrator-register.page.html',
  styleUrl: './administrator-register.page.css',
})
export class AdministratorRegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly registerOrganization = inject(RegisterOrganizationUseCase);
  private readonly router = inject(Router);

  readonly registrationForm = this.fb.group(
    {
      organizationName: ['', [Validators.required, Validators.minLength(3)]],
      ruc: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{8,14}$/)]],
      segment: [null as OrganizationSegment | null, [Validators.required]],
      administratorName: ['', [Validators.required, Validators.minLength(3)]],
      administratorEmail: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      passwordConfirmation: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly hidePassword = signal(true);
  readonly hidePasswordConfirmation = signal(true);

  togglePasswordVisibility(): void {
    this.hidePassword.update((value) => !value);
  }

  togglePasswordConfirmationVisibility(): void {
    this.hidePasswordConfirmation.update((value) => !value);
  }

  async onSubmit(): Promise<void> {
    if (this.registrationForm.invalid || this.submitting()) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    const values = this.registrationForm.getRawValue();

    try {
      await this.registerOrganization.execute(
        new RegisterOrganizationRequest(
          values.organizationName ?? '',
          values.ruc ?? '',
          values.phone ?? '',
          values.segment as OrganizationSegment,
          values.administratorName ?? '',
          values.administratorEmail ?? '',
          values.password ?? '',
        ),
      );
      await this.router.navigate(['/login'], { queryParams: { registered: 'true' } });
    } catch (error: unknown) {
      this.errorMessage.set(
        getErrorMessage(error, 'No se pudo registrar la empresa. Verifique los datos ingresados.'),
      );
    } finally {
      this.submitting.set(false);
    }
  }

  goToLogin(): void {
    void this.router.navigate(['/login']);
  }
}
