// src/app/app.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { Subscription } from 'rxjs';

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
export class AppComponent implements OnInit, OnDestroy {
  private dataSubscription!: Subscription;

  data: ExtendedScrapedData[] = [];
  filteredData: ExtendedScrapedData[] = [];
  isLoading: boolean = true;
  displayedCards: ExtendedScrapedData[] = [];
  batchSize = 20;
  isFilterActive: boolean = false;
  newDataCount: number = 0;

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
    this.dataSubscription = this.dataService.data$.subscribe(
      (updatedData) => {
        this.data = updatedData;
        this.applyCurrentFilter();
        this.isLoading = false;
      },
      (error) => {
        console.error('Error obteniendo datos:', error);
        this.isLoading = false;
      }
    );

    this.dataService.newDataCount$.subscribe((count) => {
      this.newDataCount = count;
    });

    this.loadMore();
  }

  ngOnDestroy() {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  applyCurrentFilter() {
    if (this.isFilterActive) {
      const currentFilter = this.filterService.getCurrentFilter();
      if (currentFilter) {
        this.filteredData = this.filterService.applyFilters(this.data);
      } else {
        this.filteredData = [...this.data];
      }
    } else {
      this.filteredData = [...this.data];
    }
    this.displayedCards = [];
    this.loadMore();
  }

  applyFilter(filter: FilterOptions) {
    this.isFilterActive = true;
    this.filterService.setCurrentFilter(filter);
    this.filteredData = this.filterService.applyFilters(this.data);
    this.displayedCards = loadBatch(this.filteredData, [], this.batchSize);
  }

  addNewData(newData: ExtendedScrapedData[]) {
    const filteredNewData = newData.filter(
      (item) =>
        !this.data.find((existingItem) => existingItem.href === item.href)
    );
    if (filteredNewData.length > 0) {
      this.data = [...filteredNewData, ...this.data];

      if (this.isFilterActive) {
        this.newDataCount += filteredNewData.length;
      } else {
        this.displayedCards = [...filteredNewData, ...this.displayedCards];
      }
    }
  }

  loadNewData() {
    this.newDataCount = 0;
    this.applyCurrentFilter();
    this.loadMore();
  }

  trackByIndex = trackByIndex;
}
