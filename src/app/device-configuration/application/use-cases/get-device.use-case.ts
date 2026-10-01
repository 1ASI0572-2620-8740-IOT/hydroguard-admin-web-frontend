import { inject, Injectable } from '@angular/core';
import { DeviceRepository } from '../../domain/ports/device.repository';

@Injectable({ providedIn: 'root' })
export class GetDeviceUseCase {
  private readonly repository = inject(DeviceRepository);
  execute(id: string, signal?: AbortSignal) {
    return this.repository.get(id, signal);
  }
}
