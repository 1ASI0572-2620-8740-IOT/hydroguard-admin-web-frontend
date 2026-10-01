import { inject, Injectable } from '@angular/core';
import { DeviceRepository } from '../../domain/ports/device.repository';
import { DeviceQuery } from '../../domain/models/page';
@Injectable({ providedIn: 'root' })
export class ListDevicesUseCase {
  private readonly repository = inject(DeviceRepository);
  execute(query: DeviceQuery, signal?: AbortSignal) {
    return this.repository.list(query, signal);
  }
}
