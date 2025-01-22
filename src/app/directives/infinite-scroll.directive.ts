import { Directive, HostListener, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[appInfiniteScroll]',
})
export class InfiniteScrollDirective {
  @Output() loadMore = new EventEmitter<void>();

  @HostListener('window:scroll', [])
  onScroll() {
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight - 100;
    if (scrollPosition >= threshold) {
      this.loadMore.emit();
    }
  }
}
