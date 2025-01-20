import { Injectable } from '@angular/core';
import { ExtendedScrapedData } from '../scraper-card/scraper-card.component';
import {
  FilterOptions,
  applyFilters as applyFiltersUtil,
} from '../utils/filters';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private currentFilter: FilterOptions | null = null;

  constructor() {}

  setCurrentFilter(filter: FilterOptions | null): void {
    this.currentFilter = filter;
  }

  getCurrentFilter(): FilterOptions | null {
    return this.currentFilter;
  }

  applyFilters(data: ExtendedScrapedData[]): ExtendedScrapedData[] {
    if (!this.currentFilter) {
      return data;
    }
    return applyFiltersUtil(data, this.currentFilter);
  }

  parseDaysPublished(daysPublished: string): number {
    if (daysPublished.includes('hoy')) return 0;
    if (daysPublished.includes('ayer')) return 1;
    const match = /\d+/.exec(daysPublished);
    return match ? parseInt(match[0], 10) : Infinity;
  }
}
