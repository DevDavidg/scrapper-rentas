import { computed, Injectable } from '@angular/core';
import { ExtendedScrapedData } from '../scraper-card/scraper-card.component';
import {
  convertToPesos,
  extractAmbientes,
  extractM2,
} from '../utils/data-utils';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { WebsocketService } from './websocket.service';
import { HttpClient } from '@angular/common/http';

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
    private readonly http: HttpClient
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
    const apiUrl = 'https://scraper-backend-pvvo.onrender.com/api/data';

    try {
      const response = await firstValueFrom(
        this.http.get<{ data: ExtendedScrapedData[] }>(apiUrl, {
          headers: { 'Cache-Control': 'no-cache' },
        })
      );
      const initialData = response?.data || [];
      const processedData = initialData.map((item) => ({
        ...item,
        priceInPesos: convertToPesos(item.price),
        ambientes: extractAmbientes(item.titleTypeSupProperty),
        m2: extractM2(item.titleTypeSupProperty),
        daysPublished: item.daysPublished || '',
        views: item.views || '',
        animate: true,
      }));
      this.dataSubject.next(processedData);
      console.log('Datos iniciales cargados desde la API:', processedData);
      this.isInitialDataLoaded = true;
    } catch (error) {
      console.error('Error cargando los datos iniciales:', error);
    }
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

      this.dataSubject.next([...processedData, ...currentData]);

      this.newDataCountSubject.next(
        this.newDataCountSubject.value + filteredNewData.length
      );

      setTimeout(() => {
        const updatedData = this.dataSubject.value.map((item) => ({
          ...item,
          animate: false,
        }));
        this.dataSubject.next(updatedData);
      }, 3000);
    }
  }
}
