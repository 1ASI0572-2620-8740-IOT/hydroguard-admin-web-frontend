import { inject, Injectable } from '@angular/core';
import { DeviceRepository } from '../../domain/ports/device.repository';

@Injectable({ providedIn: 'root' })
export class GetConfigurationVersionsUseCase {
  private readonly repository = inject(DeviceRepository);
  execute(id: string, signal?: AbortSignal) {
    return this.repository.configurations(id, signal);
  }
}
