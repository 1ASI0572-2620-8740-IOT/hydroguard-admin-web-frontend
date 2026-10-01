import { inject, Injectable } from '@angular/core';
import { OperationalCatalogRepository } from '../../domain/ports/operational-catalog.repository';

@Injectable({ providedIn: 'root' })
export class GetOrganizationContextUseCase {
  private readonly repository = inject(OperationalCatalogRepository);
  execute(signal?: AbortSignal) {
    return this.repository.organization(signal);
  }
}
