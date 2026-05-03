import {
  Directive,
  ElementRef,
  Inject,
  PLATFORM_ID,
  AfterViewInit,
  DOCUMENT
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
    selector: '[appStickyFooter]',
    standalone: false
})

export class StickyFooterDirective implements AfterViewInit {

  private observer!: IntersectionObserver;

  options: IntersectionObserverInit = {
    root: null,
    threshold: 0.1
  };

  constructor(
    private _element: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document
  ) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.observer = new IntersectionObserver(
        this.checkForIntersection,
        this.options
      );
      this.observer.observe(this._element.nativeElement);
    }
  }

  private checkForIntersection = (
    entries: IntersectionObserverEntry[]
  ): void => {
    entries.forEach((entry: IntersectionObserverEntry) => {
      if(!entry.isIntersecting) {
        let stickyElem = this.document.getElementById('stickyCart');
        if(stickyElem) stickyElem.classList.add('sticky_show');
      }
      else {
        let stickyElem = this.document.getElementById('stickyCart');
        if(stickyElem) stickyElem.classList.remove('sticky_show');
      }
    });
  };
  
}
