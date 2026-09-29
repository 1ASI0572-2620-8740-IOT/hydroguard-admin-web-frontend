import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AdminSessionStore } from '../../../iam/application/state/admin-session.store';
import { SignOutAdminUseCase } from '../../../iam/application/use-cases/sign-out-admin.use-case';

@Component({
  selector: 'hg-admin-layout',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RouterLink,
    RouterOutlet,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent {
  private readonly signOutUseCase = inject(SignOutAdminUseCase);
  private readonly router = inject(Router);
  readonly sessionStore = inject(AdminSessionStore);

  async signOut(): Promise<void> {
    await this.signOutUseCase.execute();
    await this.router.navigate(['/login']);
  }
}
