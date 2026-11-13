import { inject, Injectable } from '@angular/core';
import { DeviceRepository } from '../../domain/ports/device.repository';

@Injectable({ providedIn: 'root' })
export class UpdateDeviceDescriptionUseCase {
  private readonly repository = inject(DeviceRepository);

  execute(id: string, alias: string, deviceModel: string) {
    return this.repository.updateDescription(id, alias, deviceModel);
  }
}
