import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FilterOptions } from '../utils/filters';

@Component({
  selector: 'app-price-filter',
  templateUrl: './price-filter.component.html',
  styleUrls: ['./price-filter.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule],
})
export class PriceFilterComponent {
  @Output() filterChange = new EventEmitter<FilterOptions>();

  minPrice: number = 0;
  maxPrice?: number = undefined;
  order: 'asc' | 'desc' = 'asc';
  viewsOrder: 'asc' | 'desc' = 'asc';
  daysOrder: 'asc' | 'desc' = 'asc';

  ambientes?: number = undefined;
  ambienteOptions: number[] = [1, 2, 3, 4, 5];

  minM2?: number = undefined;
  maxM2?: number = undefined;

  onFilterChange() {
    this.emitFilterChange();
  }

  emitFilterChange() {
    this.filterChange.emit({
      order: this.order,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      ambientes: this.ambientes,
      minM2: this.minM2,
      maxM2: this.maxM2,
      viewsOrder: this.viewsOrder,
      daysOrder: this.daysOrder,
    });
  }
}
