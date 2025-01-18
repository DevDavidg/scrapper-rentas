import { Component, HostListener, OnInit } from '@angular/core';
import scrapedData from '../../scraped_data.json';
import {
  ExtendedScrapedData,
  ScraperCardComponent,
} from './scraper-card/scraper-card.component';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PriceFilterComponent } from './price-filter/price-filter.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  imports: [
    RouterOutlet,
    ScraperCardComponent,
    CommonModule,
    PriceFilterComponent,
  ],
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  data: ExtendedScrapedData[] = [];
  filteredData: ExtendedScrapedData[] = [];
  isLoading: boolean = true;
  displayedCards: ExtendedScrapedData[] = [];
  batchSize = 20;
  isFilterActive: boolean = false;

  @HostListener('window:scroll', [])
  onScroll() {
    if (this.isFilterActive) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight - 100;
    if (scrollPosition >= threshold) {
      this.loadMore();
    }
  }

  loadMore() {
    const nextBatch = this.filteredData.slice(
      this.displayedCards.length,
      this.displayedCards.length + this.batchSize
    );
    this.displayedCards = [...this.displayedCards, ...nextBatch];
  }

  ngOnInit() {
    if ((scrapedData as unknown as ExtendedScrapedData[]).length === 0) {
      console.warn('No data found in scraped_data.json');
      this.data = [];
      this.filteredData = [];
      this.isLoading = false;
    } else {
      this.data = (scrapedData as unknown as ExtendedScrapedData[]).map(
        (item) => ({
          ...item,
          priceInPesos: this.convertToPesos(item.price),
          titleTypeSupProperty: item.titleTypeSupProperty || '',
          ambientes: this.extractAmbientes(item.titleTypeSupProperty),
          m2: this.extractM2(item.titleTypeSupProperty),
          daysPublished: item.daysPublished || '',
          views: item.views || '',
        })
      );
      this.filteredData = [...this.data];
      this.isLoading = false;
      this.loadMore();
    }
  }

  private convertToPesos(price: string): number {
    const usdToPesoRate = 1235;
    let numericString = price.replace(/[^0-9.,]/g, '');
    numericString = numericString.replace(/\./g, '');
    numericString = numericString.replace(',', '.');

    let numericValue = parseFloat(numericString);
    if (price.includes('USD')) {
      numericValue *= usdToPesoRate;
    }

    return numericValue;
  }

  private extractAmbientes(title: string): number | undefined {
    const match = /(\d+)\s+ambiente/.exec(title);
    return match ? parseInt(match[1], 10) : undefined;
  }

  private extractM2(title: string): number | undefined {
    const match = /(\d+)\s*m²/.exec(title);
    return match ? parseInt(match[1], 10) : undefined;
  }

  applyFilter(filter: {
    order: 'asc' | 'desc';
    minPrice: number;
    maxPrice?: number;
    ambientes?: number;
    minM2?: number;
    maxM2?: number;
    viewsOrder?: 'asc' | 'desc';
    daysOrder?: 'asc' | 'desc';
  }) {
    this.isFilterActive = true;

    this.filteredData = this.data.filter((item) => {
      const meetsPrice =
        item.priceInPesos >= filter.minPrice &&
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
    });

    if (filter.viewsOrder) {
      this.filteredData = this.filteredData.sort((a, b) =>
        filter.viewsOrder === 'asc'
          ? parseInt(a.views || '0', 10) - parseInt(b.views || '0', 10)
          : parseInt(b.views || '0', 10) - parseInt(a.views || '0', 10)
      );
    }

    if (filter.daysOrder) {
      this.filteredData = this.filteredData.sort((a, b) => {
        const daysA = this.parseDaysPublished(a.daysPublished);
        const daysB = this.parseDaysPublished(b.daysPublished);

        return filter.daysOrder === 'asc' ? daysA - daysB : daysB - daysA;
      });
    }

    this.displayedCards = [];
    this.loadMore();

    this.isFilterActive = false;
  }

  parseDaysPublished(daysPublished: string): number {
    if (daysPublished.includes('hoy')) {
      return 0;
    }
    if (daysPublished.includes('ayer')) {
      return 1;
    }
    const match = /(\d+)/.exec(daysPublished);
    return match ? parseInt(match[1], 10) : Infinity;
  }

  trackByIndex(index: number, _: any): number {
    return index;
  }
}
