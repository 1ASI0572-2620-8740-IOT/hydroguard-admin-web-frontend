import { inject, Injectable } from '@angular/core';
import { DeviceRepository } from '../../domain/ports/device.repository';
import { CreateDevice } from '../../domain/models/device';
@Injectable({ providedIn: 'root' })
export class CreateDeviceUseCase {
  private readonly repository = inject(DeviceRepository);
  execute(request: CreateDevice) {
    return this.repository.create({
      ...request,
      serialNumber: request.serialNumber.trim(),
      alias: request.alias.trim(),
      deviceModel: request.deviceModel.trim(),
    });
  }
}
