import { inject, Injectable } from '@angular/core';
import { ReservoirRepository } from '../../domain/ports/reservoir.repository';
import { CreateReservoir } from '../../domain/models/reservoir';
@Injectable({ providedIn: 'root' })
export class CreateReservoirUseCase {
  private readonly repository = inject(ReservoirRepository);
  execute(request: CreateReservoir) {
    return this.repository.create({
      ...request,
      name: request.name.trim(),
      code: request.code.trim(),
      location: request.location.trim(),
    });
  }
}
