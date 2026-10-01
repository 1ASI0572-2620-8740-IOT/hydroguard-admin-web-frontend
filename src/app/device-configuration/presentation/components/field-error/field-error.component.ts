import { Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
@Component({
  selector: 'hg-field-error',
  standalone: true,
  template: `@if (control().hasError('server')) {
      {{ control().getError('server') }}
    } @else if (control().hasError('required') || control().hasError('blank')) {
      Este campo es obligatorio.
    } @else if (control().hasError('minlength')) {
      No alcanza la longitud mínima.
    } @else if (control().hasError('maxlength')) {
      Supera la longitud máxima.
    } @else if (control().hasError('min')) {
      El valor debe ser positivo.
    } @else {
      Revise el valor ingresado.
    }`,
})
export class FieldErrorComponent {
  readonly control = input.required<AbstractControl>();
}
