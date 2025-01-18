import { Injectable } from '@angular/core';
import { ExtendedScrapedData } from '../scraper-card/scraper-card.component';
import { FilterOptions, applyFilters } from '../utils/filters';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  applyFilters(
    data: ExtendedScrapedData[],
    filter: FilterOptions
  ): ExtendedScrapedData[] {
    return applyFilters(data, filter);
  }

  parseDaysPublished(daysPublished: string): number {
    if (daysPublished.includes('hoy')) return 0;
    if (daysPublished.includes('ayer')) return 1;
    const match = /\\d+/.exec(daysPublished);
    return match ? parseInt(match[0], 10) : Infinity;
  }
}
