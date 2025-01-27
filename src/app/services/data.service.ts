import { computed, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ExtendedScrapedData } from '../scraper-card/scraper-card.component';
import {
  convertToPesos,
  extractAmbientes,
  extractM2,
} from '../utils/data-utils';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { WebsocketService } from './websocket.service';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private readonly dataSubject: BehaviorSubject<ExtendedScrapedData[]> =
    new BehaviorSubject<ExtendedScrapedData[]>([]);
  public data$ = this.dataSubject.asObservable();

  private readonly newDataCountSubject = new BehaviorSubject<number>(0);
  public newDataCount$ = this.newDataCountSubject.asObservable();

  private isInitialDataLoaded = false;

  constructor(
    private readonly websocketService: WebsocketService,
    private readonly http: HttpClient,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) {
    this.initializeData();
  }

  public totalItemsCount = computed(() => this.dataSubject.value.length);

  public recentData = computed(() =>
    this.dataSubject.value.filter((item) => item.animate)
  );

  private async initializeData(): Promise<void> {
    await this.loadInitialData();
    this.initializeWebSocketConnection();
  }

  private async loadInitialData(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      console.warn(
        'El entorno no es el navegador, no se puede cargar la data.'
      );
      return;
    }

    const apiUrl = 'https://scraper-backend-pvvo.onrender.com/api/data';

    try {
      const response = await firstValueFrom(
        this.http.get<{ data: ExtendedScrapedData[] }>(apiUrl, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        })
      );

      const initialData = response?.data || [];

      const validData = initialData.filter(
        (item) => item.price !== undefined && item.images.length > 0
      );

      const processedData = validData.map((item) => ({
        ...item,
        priceInPesos: convertToPesos(item.price),
        ambientes: extractAmbientes(item.titleTypeSupProperty),
        m2: extractM2(item.titleTypeSupProperty),
        daysPublished: item.daysPublished || '',
        views: item.views || '',
        animate: true,
      }));

      this.dataSubject.next(processedData);
      this.isInitialDataLoaded = true;
    } catch (error) {
      console.error('Error cargando los datos iniciales:', error);
    }
  }

  public reloadData(): void {
    this.loadInitialData();
  }

  private initializeWebSocketConnection(): void {
    const wsUrl = 'wss://scraper-backend-pvvo.onrender.com/api/ws';

    this.websocketService.connect(wsUrl).subscribe({
      next: (message) => {
        if (this.isInitialDataLoaded) {
          const newData = Array.isArray(message)
            ? (message as ExtendedScrapedData[])
            : [message as ExtendedScrapedData];

          this.addData(newData);
        }
      },
      error: (error) => {
        console.error('Error en el WebSocket:', error);
      },
      complete: () => {
        console.warn('WebSocket cerrado');
      },
    });
  }

  private addData(newData: ExtendedScrapedData[]): void {
    const currentData = this.dataSubject.value;

    const filteredNewData = newData.filter(
      (item) =>
        !currentData.some((existingItem) => existingItem.href === item.href)
    );

    if (filteredNewData.length > 0) {
      const processedData = filteredNewData.map((item) => ({
        ...item,
        priceInPesos: convertToPesos(item.price),
        ambientes: extractAmbientes(item.titleTypeSupProperty),
        m2: extractM2(item.titleTypeSupProperty),
        animate: true,
      }));

      const updatedData = [...processedData, ...currentData];

      this.dataSubject.next(updatedData);

      setTimeout(() => {
        const nonAnimatedData = this.dataSubject.value.map((item) => ({
          ...item,
          animate: false,
        }));
        this.dataSubject.next(nonAnimatedData);
      }, 3000);
    }
  }
}
