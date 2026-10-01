import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { QueryState } from '../../../application/state/query-state';
import { PageActions } from '../../state/page-actions';
import { QueryFeedbackComponent } from '../../components/query-feedback/query-feedback.component';
import { ActionFeedbackComponent } from '../../components/action-feedback/action-feedback.component';
import { ConfigurationLabelPipe } from '../../state/labels';

import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { DeviceDetail } from '../../../domain/models/details';
import { OperationalOptions } from '../../../domain/models/operational-catalog';
import { GetDeviceUseCase } from '../../../application/use-cases/get-device.use-case';
import { LinkDeviceUseCase } from '../../../application/use-cases/link-device.use-case';
import { UnlinkDeviceUseCase } from '../../../application/use-cases/unlink-device.use-case';
import { DeactivateDeviceUseCase } from '../../../application/use-cases/deactivate-device.use-case';
import { GetOperationalOptionsUseCase } from '../../../application/use-cases/get-operational-options.use-case';
@Component({
  selector: 'hg-device-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    QueryFeedbackComponent,
    ActionFeedbackComponent,
    ConfigurationLabelPipe,
    DatePipe,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  providers: [PageActions],
  templateUrl: './device-detail.page.html',
  styleUrl: '../../configuration-page.css',
})
export class DeviceDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly actions = inject(PageActions);
  private readonly get = inject(GetDeviceUseCase);
  private readonly linkDevice = inject(LinkDeviceUseCase);
  private readonly unlinkDevice = inject(UnlinkDeviceUseCase);
  private readonly deactivate = inject(DeactivateDeviceUseCase);
  private readonly getOptions = inject(GetOperationalOptionsUseCase);
  readonly state = new QueryState<DeviceDetail>();
  readonly options = new QueryState<OperationalOptions>();
  readonly form = inject(FormBuilder).nonNullable.group({ reservoirId: ['', Validators.required] });
  get id() {
    return this.route.snapshot.paramMap.get('deviceId') ?? '';
  }
  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.state.data.set(null);
      void this.load();
    });
  }
  async load() {
    const id = this.id;
    await Promise.all([
      this.state.load((signal) => this.get.execute(id, signal)),
      this.options.load((signal) => this.getOptions.execute(signal)),
    ]);
  }
  async link() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const id = this.id;
    const reservoirId = this.form.controls.reservoirId.value;
    await this.actions.run(
      'Vincular dispositivo',
      () => this.linkDevice.execute(id, reservoirId),
      () => this.load(),
      'Se vinculará este dispositivo exclusivamente al reservorio seleccionado.',
      this.form,
    );
    this.form.reset();
  }
  unlink() {
    const id = this.id;
    return this.actions.run(
      'Retirar vinculación',
      () => this.unlinkDevice.execute(id),
      () => this.load(),
      'Primero debe cerrar la asignación del responsable. El dispositivo quedará activo sin vincular.',
    );
  }
  disable() {
    const id = this.id;
    return this.actions.run(
      'Desactivar dispositivo',
      () => this.deactivate.execute(id),
      () => this.load(),
      'Se conservará el dispositivo y su historial. Debe estar sin vinculación, asignación ni proceso activo.',
    );
  }
}
