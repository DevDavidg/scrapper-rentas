import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, NgZone } from '@angular/core';
import { Observable, Subject, Observer } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private ws!: WebSocket;
  private subject!: Subject<unknown>;

  constructor(
    private readonly ngZone: NgZone,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) {}

  public connect(url: string): Subject<unknown> {
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('Error en el websocket: no se puede conectar');
      return new Subject<unknown>();
    }

    if (!this.subject) {
      this.subject = this.create(url);
      console.log(`Conectando al WebSocket en: ${url}`);
    }
    return this.subject;
  }

  private create(url: string): Subject<unknown> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return this.subject;
    }

    this.ws = new WebSocket(url);

    const observable = new Observable<unknown>(
      (observer: Observer<unknown>) => {
        this.ws.onmessage = (event: MessageEvent) => {
          this.ngZone.run(() => observer.next(JSON.parse(event.data)));
        };
        this.ws.onerror = (event: Event) => {
          this.ngZone.run(() => observer.error(event));
        };
        this.ws.onclose = () => {
          this.ngZone.run(() => {
            observer.complete();
            this.reconnect(url);
          });
        };
        return () => this.ws.close();
      }
    );

    const observer: Observer<unknown> = {
      next: (data: unknown) => {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(data));
        }
      },
      error: () => {},
      complete: () => {},
    };

    this.subject = new Subject<unknown>();
    this.subject.subscribe(observer);
    observable.subscribe(this.subject);
    return this.subject;
  }

  private reconnect(url: string): void {
    setTimeout(() => this.connect(url), 5000);
  }
}
