import { inject, Injectable } from '@angular/core';
import { DeviceRepository } from '../../domain/ports/device.repository';

@Injectable({ providedIn: 'root' })
export class DeactivateDeviceUseCase {
  private readonly repository = inject(DeviceRepository);
  execute(id: string) {
    return this.repository.deactivate(id);
  }
}
