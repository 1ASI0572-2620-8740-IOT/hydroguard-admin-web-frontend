import { inject, Injectable } from '@angular/core';
import { IamRepository, OperatorFilter, OperatorPage } from '../../domain/ports/iam.repository';

@Injectable({
  providedIn: 'root',
})
export class ListOperatorAccountsUseCase {
  private readonly iamRepo = inject(IamRepository);

  async execute(filter?: OperatorFilter): Promise<OperatorPage> {
    const normalizedFilter: OperatorFilter = {
      searchTerm: filter?.searchTerm?.trim() || undefined,
      status: filter?.status,
      page: filter?.page && filter.page > 0 ? filter.page : 1,
      pageSize: filter?.pageSize && filter.pageSize > 0 ? filter.pageSize : 10,
    };

    return this.iamRepo.findOperators(normalizedFilter);
  }
}
