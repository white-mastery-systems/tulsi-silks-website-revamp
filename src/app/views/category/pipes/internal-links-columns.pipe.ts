import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pure pipe so accordion link columns keep stable references across change detection.
 * Method calls in *ngFor recreate arrays every cycle → flicker / unclickable links.
 */
@Pipe({
  name: 'internalLinksColumns',
  pure: true,
  standalone: false
})
export class InternalLinksColumnsPipe implements PipeTransform {
  transform(source: any, columnCount = 3): any[][] {
    const count = Math.max(1, Number(columnCount) || 3);
    let items: any[] = [];

    if (Array.isArray(source)) {
      items = source;
    } else if (source?.link_list) {
      items = (source.link_list || []).filter(
        (link: any) => link?.btn_status !== false && link?.btn_text
      );
    } else if (source?.links) {
      items = source.links || [];
    }

    if (!items.length) return [];

    const perCol = Math.ceil(items.length / count);
    const columns: any[][] = [];
    for (let i = 0; i < count; i++) {
      const chunk = items.slice(i * perCol, (i + 1) * perCol);
      if (chunk.length) columns.push(chunk);
    }
    return columns;
  }
}
