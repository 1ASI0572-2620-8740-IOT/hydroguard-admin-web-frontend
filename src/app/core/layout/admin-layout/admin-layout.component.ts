import { Component, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { AdminSessionStore } from '../../../iam/application/state/admin-session.store';
import { SignOutAdminUseCase } from '../../../iam/application/use-cases/sign-out-admin.use-case';

@Component({
  selector: 'hg-admin-layout',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatTooltipModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent {
  private readonly signOutUseCase = inject(SignOutAdminUseCase);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);
  readonly sessionStore = inject(AdminSessionStore);
  readonly isHandset = toSignal(
    this.breakpointObserver.observe('(max-width: 900px)').pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  closeNavigation(drawer: MatSidenav): void {
    if (this.isHandset()) void drawer.close();
  }

  async signOut(): Promise<void> {
    await this.signOutUseCase.execute();
    await this.router.navigate(['/login']);
  }
}
