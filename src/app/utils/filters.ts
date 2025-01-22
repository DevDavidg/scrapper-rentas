import { ExtendedScrapedData } from '../scraper-card/scraper-card.component';

export interface FilterOptions {
  order: 'asc' | 'desc';
  minPrice: number;
  maxPrice?: number;
  ambientes?: number;
  minM2?: number;
  maxM2?: number;
  viewsOrder?: 'asc' | 'desc';
  daysOrder?: 'asc' | 'desc';
}

export function applyFilters(
  data: ExtendedScrapedData[],
  filter: FilterOptions
): ExtendedScrapedData[] {
  return data
    .filter((item) => {
      const meetsPrice =
        item.priceInPesos >= (filter.minPrice || 0) &&
        (filter.maxPrice !== undefined
          ? item.priceInPesos <= filter.maxPrice
          : true);

      const meetsAmbientes =
        filter.ambientes === undefined ||
        (item.ambientes ?? 0) >= filter.ambientes;

      const meetsM2 =
        (filter.minM2 === undefined || (item.m2 ?? 0) >= filter.minM2) &&
        (filter.maxM2 === undefined || (item.m2 ?? 0) <= filter.maxM2);

      return meetsPrice && meetsAmbientes && meetsM2;
    })
    .sort((a, b) => {
      if (filter.order) {
        return filter.order === 'asc'
          ? a.priceInPesos - b.priceInPesos
          : b.priceInPesos - a.priceInPesos;
      }
      return 0;
    })
    .sort((a, b) => {
      if (filter.viewsOrder) {
        return filter.viewsOrder === 'asc'
          ? parseInt(a.views || '0', 10) - parseInt(b.views || '0', 10)
          : parseInt(b.views || '0', 10) - parseInt(a.views || '0', 10);
      }
      return 0;
    })
    .sort((a, b) => {
      if (filter.daysOrder) {
        const daysA = parseDaysPublished(a.daysPublished);
        const daysB = parseDaysPublished(b.daysPublished);
        return filter.daysOrder === 'asc' ? daysA - daysB : daysB - daysA;
      }
      return 0;
    });
}

export function parseDaysPublished(daysPublished: string): number {
  if (daysPublished.includes('hoy')) {
    return 0;
  }
  if (daysPublished.includes('ayer')) {
    return 1;
  }
  const match = /\\d+/.exec(daysPublished);
  return match ? parseInt(match[0], 10) : Infinity;
}
