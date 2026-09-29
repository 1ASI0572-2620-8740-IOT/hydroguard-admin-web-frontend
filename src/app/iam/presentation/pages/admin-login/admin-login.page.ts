import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { getErrorMessage } from '../../../../shared/utils/error-message';
import { SignInAdminUseCase } from '../../../application/use-cases/sign-in-admin.use-case';
import { SignInRequest } from '../../../domain/models/sign-in.request';

@Component({
  selector: 'hg-admin-login-page',
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
  templateUrl: './admin-login.page.html',
  styleUrl: './admin-login.page.css',
})
export class AdminLoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly signInUseCase = inject(SignInAdminUseCase);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly hidePassword = signal(true);
  readonly registrationCreated = signal(
    this.route.snapshot.queryParamMap.get('registered') === 'true',
  );

  togglePasswordVisibility(): void {
    this.hidePassword.update((val) => !val);
  }

  goToRegistration(): void {
    void this.router.navigate(['/register']);
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid || this.loading()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    try {
      await this.signInUseCase.execute(new SignInRequest(email, password));
      await this.router.navigate(['/users']);
    } catch (error: unknown) {
      this.errorMessage.set(
        getErrorMessage(error, 'Error inesperado al iniciar sesión. Intente nuevamente.'),
      );
    } finally {
      this.loading.set(false);
    }
  }
}
