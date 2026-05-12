import {
  AfterViewInit,
  Directive,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  PLATFORM_ID,
  Renderer2,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Lazy-loads `ImagelazyLoad` when the host enters the IntersectionObserver root.
 * Default `intersectionRootMargin` expands the bottom edge so above-the-fold work
 * still prefetches footer assets under slow networks (see Chrome DevTools → Network → Throttling).
 */
@Directive({
  selector: '[appImgIntersection]',
  standalone: false,
})
export class ImgIntersectionDirective implements AfterViewInit, OnDestroy {
  public lqip_img: string;
  @Input() ImagelazyLoad: string;

  /**
   * CSS margin string passed to `IntersectionObserver` (e.g. `"0px 0px 500px 0px"`).
   * Larger bottom margin → earlier load before the element scrolls into view.
   */
  @Input() intersectionRootMargin = '0px 0px 500px 0px';

  /** `IntersectionObserverInit.threshold` — default 0 fires when the first pixel would cross. */
  @Input() intersectionThreshold: number | number[] = 0;

  private observer: IntersectionObserver | null = null;

  constructor(
    private _element: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngAfterViewInit(): void {
    this.lqip_img = 'assets/images/placeholder.svg';
    this.renderer.setAttribute(this._element.nativeElement, 'src', this.lqip_img);
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: this.intersectionRootMargin,
      threshold: this.intersectionThreshold,
    };

    this.observer = new IntersectionObserver((entries) => this.checkForIntersection(entries), options);
    this.observer.observe(this._element.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  private checkForIntersection = (entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry: IntersectionObserverEntry) => {
      if (this.checkIfIntersecting(entry)) {
        const el = this._element.nativeElement;
        if (el.localName === 'img') {
          this.renderer.setAttribute(el, 'src', this.ImagelazyLoad);
        } else {
          this.renderer.setStyle(el, 'background-image', `url(${this.ImagelazyLoad})`);
        }
        this.observer?.unobserve(el);
        this.observer?.disconnect();
        this.observer = null;
      }
    });
  };

  private checkIfIntersecting(entry: IntersectionObserverEntry): boolean {
    return entry.isIntersecting && entry.target === this._element.nativeElement;
  }
}
