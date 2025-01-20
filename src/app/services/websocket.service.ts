import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private ws!: WebSocket;
  private subject!: Subject<any>;

  constructor(private readonly ngZone: NgZone) {}

  public connect(url: string): Subject<any> {
    if (!this.subject) {
      this.subject = this.create(url);
      console.log(`Conectando al WebSocket en: ${url}`);
    }
    return this.subject;
  }

  private create(url: string): Subject<any> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return this.subject;
    }

    this.ws = new WebSocket(url);
    const observable = new Observable<any>((observer) => {
      this.ws.onmessage = (event) => {
        this.ngZone.run(() => observer.next(JSON.parse(event.data)));
      };
      this.ws.onerror = (event) => {
        this.ngZone.run(() => observer.error(event));
      };
      this.ws.onclose = () => {
        this.ngZone.run(() => {
          observer.complete();
          setTimeout(() => this.connect(url), 5000);
        });
      };
      return () => this.ws.close();
    });

    const observer = {
      next: (data: any) => {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(data));
        }
      },
    };

    this.subject = Subject.create(observer, observable);
    return this.subject;
  }
}
