import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmLabel: string;
}

@Component({
  selector: 'hg-confirmation-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.css',
})
export class ConfirmationDialogComponent {
  readonly data = inject<ConfirmationDialogData>(MAT_DIALOG_DATA);
}
