import { Component, OnInit } from '@angular/core';
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
        })
      );
      this.filteredData = [...this.data];
      this.isLoading = false;
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
  }) {
    this.filteredData = this.data
      .filter((item) => {
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
      })
      .sort((a, b) =>
        filter.order === 'asc'
          ? a.priceInPesos - b.priceInPesos
          : b.priceInPesos - a.priceInPesos
      );
  }
}
