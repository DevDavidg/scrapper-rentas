import { Injectable } from '@angular/core';
import { ExtendedScrapedData } from '../scraper-card/scraper-card.component';
import {
  convertToPesos,
  extractAmbientes,
  extractM2,
} from '../utils/data-utils';
import { BehaviorSubject } from 'rxjs';
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

  constructor(
    private readonly websocketService: WebsocketService,
    private readonly http: HttpClient
  ) {
    this.initializeData();
  }

  private initializeData(): void {
    this.loadInitialData();
    this.initializeWebSocketConnection();
  }

  private loadInitialData(): void {
    const apiUrl = 'https://scraper-backend-pvvo.onrender.com/api/data';

    this.http.get<{ data: ExtendedScrapedData[] }>(apiUrl).subscribe(
      (response) => {
        console.log('Datos iniciales cargados desde la API:', response.data);
        this.addData(response.data);
      },
      (error) => {
        console.error('Error cargando los datos iniciales:', error);
      }
    );
  }

  private initializeWebSocketConnection(): void {
    const wsUrl = 'wss://scraper-backend-pvvo.onrender.com/api/ws';

    this.websocketService.connect(wsUrl).subscribe(
      (message) => {
        console.log('Mensaje recibido del WebSocket:', message);

        if (!Array.isArray(message)) {
          this.addData([message as ExtendedScrapedData]);
        } else {
          this.addData(message as ExtendedScrapedData[]);
        }
      },
      (error) => {
        console.error('Error en el WebSocket:', error);
      },
      () => {
        console.warn('WebSocket cerrado');
      }
    );
  }

  private addData(newData: ExtendedScrapedData[]): void {
    const currentData = this.dataSubject.value;

    const filteredNewData = newData.filter(
      (item: ExtendedScrapedData) =>
        !currentData.some(
          (existingItem: ExtendedScrapedData) => existingItem.href === item.href
        )
    );

    if (filteredNewData.length > 0) {
      const processedData = filteredNewData.map(
        (item: ExtendedScrapedData) => ({
          ...item,
          priceInPesos: convertToPesos(item.price),
          titleTypeSupProperty: item.titleTypeSupProperty || '',
          ambientes: extractAmbientes(item.titleTypeSupProperty),
          m2: extractM2(item.titleTypeSupProperty),
          daysPublished: item.daysPublished || '',
          views: item.views || '',
        })
      );

      this.dataSubject.next([...processedData, ...currentData]);

      this.newDataCountSubject.next(
        this.newDataCountSubject.value + filteredNewData.length
      );
    }
  }
}
