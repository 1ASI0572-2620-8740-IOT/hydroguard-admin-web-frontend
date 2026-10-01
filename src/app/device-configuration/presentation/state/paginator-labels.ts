import { MatPaginatorIntl } from '@angular/material/paginator';

export const configurationPaginatorLabels = (): MatPaginatorIntl => {
  const labels = new MatPaginatorIntl();
  labels.itemsPerPageLabel = 'Elementos por página:';
  labels.nextPageLabel = 'Página siguiente';
  labels.previousPageLabel = 'Página anterior';
  labels.firstPageLabel = 'Primera página';
  labels.lastPageLabel = 'Última página';
  labels.getRangeLabel = (page, pageSize, length) =>
    length === 0
      ? '0 de 0'
      : `${page * pageSize + 1} – ${Math.min((page + 1) * pageSize, length)} de ${length}`;
  return labels;
};
