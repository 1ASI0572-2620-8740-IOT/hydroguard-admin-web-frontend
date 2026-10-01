import { AbstractControl, ValidationErrors } from '@angular/forms';
export const notBlank = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && !control.value.trim() ? { blank: true } : null;
export const positiveNumber = (control: AbstractControl): ValidationErrors | null =>
  control.value === null ||
  control.value === '' ||
  (typeof control.value === 'number' && Number.isFinite(control.value) && control.value > 0)
    ? null
    : { min: true };
