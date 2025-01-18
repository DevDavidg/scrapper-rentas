import { Component, OnInit } from '@angular/core';
import {
  ExtendedScrapedData,
  ScraperCardComponent,
} from './scraper-card/scraper-card.component';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PriceFilterComponent } from './price-filter/price-filter.component';
import { FilterOptions } from './utils/filters';
import { InfiniteScrollDirective } from './directives/infinite-scroll.directive';
import { DataService } from './services/data.service';
import { loadBatch } from './utils/pagination-utils';
import { FilterService } from './services/filter.service';
import { trackByIndex } from './utils/common-utils';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  imports: [
    RouterOutlet,
    ScraperCardComponent,
    CommonModule,
    PriceFilterComponent,
    InfiniteScrollDirective,
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

  constructor(
    private readonly dataService: DataService,
    private readonly filterService: FilterService
  ) {}

  loadMore() {
    this.displayedCards = loadBatch(
      this.filteredData,
      this.displayedCards,
      this.batchSize
    );
  }

  ngOnInit() {
    this.data = this.dataService.getData();
    this.filteredData = [...this.data];
    this.isLoading = false;
    this.loadMore();
  }

  applyFilter(filter: FilterOptions) {
    this.isFilterActive = true;
    this.filteredData = this.filterService.applyFilters(this.data, filter);
    this.displayedCards = this.filteredData.slice(0, this.batchSize);
    this.isFilterActive = false;
  }

  trackByIndex = trackByIndex;
}
