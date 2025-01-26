import { ExtendedScrapedData } from '../scraper-card/scraper-card.component';

export interface FilterOptions {
  order: 'asc' | 'desc';
  minPrice: number | undefined;
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
  const filteredData = data.filter((item) => {
    const meetsPrice =
      (filter.minPrice === undefined || item.priceInPesos >= filter.minPrice) &&
      (filter.maxPrice === undefined || item.priceInPesos <= filter.maxPrice);

    const meetsAmbientes =
      filter.ambientes === undefined ||
      (item.ambientes ?? 0) >= filter.ambientes;

    const meetsM2 =
      (filter.minM2 === undefined || (item.m2 ?? 0) >= filter.minM2) &&
      (filter.maxM2 === undefined || (item.m2 ?? 0) <= filter.maxM2);

    return meetsPrice && meetsAmbientes && meetsM2;
  });

  return filteredData.sort((a, b) => {
    if (filter.order) {
      const priceComparison =
        filter.order === 'asc'
          ? a.priceInPesos - b.priceInPesos
          : b.priceInPesos - a.priceInPesos;
      if (priceComparison !== 0) return priceComparison;
    }

    if (filter.viewsOrder) {
      const viewsA = parseInt(a.views || '0', 10);
      const viewsB = parseInt(b.views || '0', 10);
      const viewsComparison =
        filter.viewsOrder === 'asc' ? viewsA - viewsB : viewsB - viewsA;
      if (viewsComparison !== 0) return viewsComparison;
    }

    if (filter.daysOrder) {
      const daysA = parseDaysPublished(a.daysPublished);
      const daysB = parseDaysPublished(b.daysPublished);
      return filter.daysOrder === 'asc' ? daysA - daysB : daysB - daysA;
    }

    return 0;
  });
}

export function parseDaysPublished(daysPublished: string): number {
  if (!daysPublished) return Infinity;

  if (daysPublished.toLowerCase().includes('hoy')) {
    return 0;
  }
  if (daysPublished.toLowerCase().includes('ayer')) {
    return 1;
  }

  const match = /\d+/.exec(daysPublished);
  return match ? parseInt(match[0], 10) : Infinity;
}
