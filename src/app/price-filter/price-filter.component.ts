import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-price-filter',
  templateUrl: './price-filter.component.html',
  styleUrls: ['./price-filter.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule],
})
export class PriceFilterComponent {
  @Output() filterChange = new EventEmitter<{
    order: 'asc' | 'desc';
    minPrice: number;
    maxPrice?: number;
    ambientes?: number;
    minM2?: number;
    maxM2?: number;
  }>();

  minPrice: number = 0;
  maxPrice?: number = undefined;
  order: 'asc' | 'desc' = 'asc';

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
    });
  }
}
