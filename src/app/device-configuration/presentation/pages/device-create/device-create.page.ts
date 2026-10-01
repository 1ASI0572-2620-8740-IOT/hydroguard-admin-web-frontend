import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PageActions } from '../../state/page-actions';
import { notBlank } from '../../state/form-validators';
import { ActionFeedbackComponent } from '../../components/action-feedback/action-feedback.component';
import { FieldErrorComponent } from '../../components/field-error/field-error.component';
import { ConfigurationLabelPipe } from '../../state/labels';

import { CreateDeviceUseCase } from '../../../application/use-cases/create-device.use-case';
import { DeviceCapability, OperatingEnvironment } from '../../../domain/models/device';
@Component({
  selector: 'hg-device-create-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ActionFeedbackComponent,
    FieldErrorComponent,
    ConfigurationLabelPipe,
  ],
  providers: [PageActions],
  templateUrl: './device-create.page.html',
  styleUrl: '../../configuration-page.css',
})
export class DeviceCreatePage {
  private readonly create = inject(CreateDeviceUseCase);
  private readonly router = inject(Router);
  readonly actions = inject(PageActions);
  readonly capabilities: ReadonlyArray<DeviceCapability> = [
    'PH_SENSOR',
    'TEMPERATURE_SENSOR',
    'DOSING',
    'HEATING',
    'COOLING',
    'RELEASE_VALVE',
  ];
  readonly form = inject(FormBuilder).nonNullable.group({
    serialNumber: [
      '',
      [Validators.required, notBlank, Validators.minLength(3), Validators.maxLength(80)],
    ],
    alias: [
      '',
      [Validators.required, notBlank, Validators.minLength(3), Validators.maxLength(120)],
    ],
    deviceModel: [
      '',
      [Validators.required, notBlank, Validators.minLength(3), Validators.maxLength(80)],
    ],
    operatingEnvironment: ['ACADEMIC_PROTOTYPE' as OperatingEnvironment, Validators.required],
    capabilities: [['PH_SENSOR', 'TEMPERATURE_SENSOR'] as DeviceCapability[], Validators.required],
  });
  async submit() {
    if (this.form.invalid || this.actions.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    await this.actions.run(
      'Registrar dispositivo',
      async () => {
        const device = await this.create.execute(this.form.getRawValue());
        await this.router.navigate(['/devices', device.id]);
      },
      undefined,
      undefined,
      this.form,
    );
  }
}
