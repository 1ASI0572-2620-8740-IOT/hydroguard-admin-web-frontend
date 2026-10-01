import { inject, Injectable } from '@angular/core';
import { DeviceRepository } from '../../domain/ports/device.repository';

@Injectable({ providedIn: 'root' })
export class LinkDeviceUseCase {
  private readonly repository = inject(DeviceRepository);
  execute(id: string, reservoirId: string) {
    return this.repository.link(id, reservoirId);
  }
}
