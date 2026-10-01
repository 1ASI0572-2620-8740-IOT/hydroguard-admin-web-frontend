import { Component, input } from '@angular/core';
@Component({
  selector: 'hg-action-feedback',
  standalone: true,
  template: `@if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }
    @if (success()) {
      <p class="success" role="status">{{ success() }}</p>
    }`,
  styles:
    '.error, .success { padding: 16px; border-radius: 10px; } .error { color: #991b1b; background: #fff1f2; } .success { color: #166534; background: #f0fdf4; }',
})
export class ActionFeedbackComponent {
  readonly error = input<string | null>(null);
  readonly success = input<string | null>(null);
}
