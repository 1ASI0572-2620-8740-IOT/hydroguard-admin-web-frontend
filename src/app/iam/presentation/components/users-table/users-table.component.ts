import { CommonModule, DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OperatorAccount } from '../../../domain/models/operator-account';

@Component({
  selector: 'hg-users-table',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  templateUrl: './users-table.component.html',
  styleUrl: './users-table.component.css',
})
export class UsersTableComponent {
  readonly users = input<ReadonlyArray<OperatorAccount>>([]);
  readonly total = input<number>(0);
  readonly pageSize = input<number>(10);
  readonly pageIndex = input<number>(0);
  readonly loading = input<boolean>(false);

  readonly displayedColumns: string[] = [
    'displayName',
    'identifier',
    'status',
    'createdAt',
    'actions',
  ];

  readonly pageChange = output<PageEvent>();
  readonly userSelected = output<string>();
  readonly deactivateUser = output<string>();
  readonly manageAccessCode = output<string>();

  onPage(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  onSelect(user: OperatorAccount): void {
    this.userSelected.emit(user.id);
  }

  onDeactivate(user: OperatorAccount, event: Event): void {
    event.stopPropagation();
    this.deactivateUser.emit(user.id);
  }

  onAccessCode(user: OperatorAccount, event: Event): void {
    event.stopPropagation();
    this.manageAccessCode.emit(user.id);
  }
}
