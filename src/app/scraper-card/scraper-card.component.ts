import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ScrapedData {
  price: string;
  expenses: string;
  location: string;
  href: string;
  images: string[];
  titleTypeSupProperty: string;
}

export interface ExtendedScrapedData extends ScrapedData {
  priceInPesos: number;
  ambientes?: number;
  m2?: number;
}

@Component({
  selector: 'app-scraper-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scraper-card.component.html',
  styleUrls: ['./scraper-card.component.scss'],
})
export class ScraperCardComponent implements OnInit {
  @Input() data!: ExtendedScrapedData;
  isFavorited: boolean = false;
  imageLoaded: boolean = false;

  get firstImage(): string {
    return this.data.images?.[0] ?? 'assets/placeholder.png';
  }

  ngOnInit() {
    this.checkIfFavorited();
  }

  toggleFavorite() {
    this.isFavorited = !this.isFavorited;
    this.updateFavorites();
  }

  checkIfFavorited() {
    const favorites = JSON.parse(localStorage.getItem('favorites') ?? '[]');
    this.isFavorited = favorites.includes(this.data.href);
  }

  updateFavorites() {
    let favorites = JSON.parse(localStorage.getItem('favorites') ?? '[]');
    if (this.isFavorited) {
      favorites.push(this.data.href);
    } else {
      favorites = favorites.filter((href: string) => href !== this.data.href);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    console.log(
      `Propiedad ${this.isFavorited ? 'añadida a' : 'removida de'} favoritos.`
    );
  }

  onImageLoad() {
    this.imageLoaded = true;
  }

  onImageError() {
    this.imageLoaded = false;
  }
}
