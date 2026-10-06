import { inject, Injectable } from '@angular/core';
import { DeviceRepository } from '../../domain/ports/device.repository';

@Injectable({ providedIn: 'root' })
export class RevokeDeviceIdentityUseCase {
  private readonly repository = inject(DeviceRepository);

  execute(deviceId: string) {
    return this.repository.revokeIdentity(deviceId);
  }
}
