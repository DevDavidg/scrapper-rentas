import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

export interface ScrapedData {
  price: string;
  expenses: string;
  location: string;
  href: string;
  images: string[];
  titleTypeSupProperty: string;
  daysPublished: string;
  views: string;
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
  host: { '[attr.data-component-id]': 'uniqueId' },
})
export class ScraperCardComponent implements OnInit {
  uniqueId = `scraper-card-${Math.random()}`;
  @Input() data!: ExtendedScrapedData;
  isFavorited: boolean = false;
  imageLoaded: boolean = false;
  currentIndex: number = 0;
  animationDirection: 'right' | 'left' | '' = '';

  constructor(@Inject(PLATFORM_ID) private readonly platformId: any) {}
  get firstImage(): string {
    return this.data.images?.[0] ?? 'assets/placeholder.png';
  }

  get currentImage(): string {
    return this.data.images?.[this.currentIndex] ?? '';
  }

  nextImage() {
    if (this.data.images && this.data.images.length > 0) {
      this.animationDirection = 'left';
      setTimeout(() => {
        this.currentIndex = (this.currentIndex + 1) % this.data.images.length;
      }, 0);
    }
  }

  prevImage() {
    if (this.data.images && this.data.images.length > 0) {
      this.animationDirection = 'right';
      setTimeout(() => {
        this.currentIndex =
          (this.currentIndex - 1 + this.data.images.length) %
          this.data.images.length;
      }, 0);
    }
  }

  resetAnimation() {
    this.animationDirection = '';
  }

  goToImage(index: number) {
    if (this.data.images?.[index]) {
      this.currentIndex = index;
    }
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkIfFavorited();
    }
  }

  toggleFavorite() {
    if (isPlatformBrowser(this.platformId)) {
      this.isFavorited = !this.isFavorited;
      this.updateFavorites();
    }
  }

  checkIfFavorited() {
    if (isPlatformBrowser(this.platformId)) {
      const favorites = JSON.parse(localStorage.getItem('favorites') ?? '[]');
      this.isFavorited = favorites.includes(this.data.href);
    }
  }

  updateFavorites() {
    if (isPlatformBrowser(this.platformId)) {
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
  }

  onImageLoad() {
    this.imageLoaded = true;
  }

  onImageError() {
    this.imageLoaded = false;
  }
}
