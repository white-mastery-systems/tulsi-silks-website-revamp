import { AfterViewInit, Directive, ElementRef, Inject, Input, OnDestroy, OnInit, PLATFORM_ID, Renderer2 } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

/**
 * Lazy loads images using a native `IntersectionObserver` (replaces the legacy `lazysizes`
 * dependency). Preserves the existing `.lazyload`, `.blur-up`, `.lazyloaded` class contract so
 * `styles.scss` blur-up styling continues to work without changes.
 */
@Directive({
    selector: '[appImgLazyLoad]',
    host: { '(error)': 'placeholder()', '(load)': 'onImgLoad()' },
    standalone: false
})

export class ImgLazyLoadDirective implements OnInit, AfterViewInit, OnDestroy {

  @Input() ImagelazyLoad: any;
  public lqip_img : any;
  private observer: IntersectionObserver | null = null;
  private fullSrc = '';
  /** Same-origin/asset URLs bypass `_s` LQIP + `.blur-up`, which looked like broken LCP on mobile. */
  private skipIntersectionLqip = false;

  constructor(
    private _element: ElementRef,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: object
  ) { }

  ngOnInit() {
    this.fullSrc = (this.ImagelazyLoad ?? '').toString();

    if (this.shouldBypassLqipBlur(this.fullSrc)) {
      this.skipIntersectionLqip = true;
      this.renderer.setAttribute(this._element.nativeElement, 'src', this.fullSrc);
      this.renderer.removeClass(this._element.nativeElement, 'lazyload');
      this.renderer.removeClass(this._element.nativeElement, 'blur-up');
      return;
    }

    let imgArray = this.ImagelazyLoad.split(environment.img_host);
    if(imgArray.length==2) this.lqip_img = environment.img_host+imgArray[1].split('.').join('_s.');
    else this.lqip_img = "assets/images/placeholder.svg";
    this.setInitialAttributes();
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId) || this.skipIntersectionLqip) return;
    if (typeof IntersectionObserver === 'undefined') {
      this.swapToFull();
      return;
    }
    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.target === this._element.nativeElement) {
          this.swapToFull();
          this.disconnect();
          break;
        }
      }
    }, { rootMargin: '200px 100px 500px 100px', threshold: 0 });
    this.observer.observe(this._element.nativeElement);

    // Swiper (overflow:hidden) + late layout can miss the first IO callback.
    // If the element is already near the viewport, promote immediately.
    requestAnimationFrame(() => this.promoteIfNearViewport());
  }

  ngOnDestroy() {
    this.disconnect();
  }

  setInitialAttributes() {
    this.renderer.addClass(this._element.nativeElement, 'lazyload');
    this.renderer.addClass(this._element.nativeElement, 'blur-up');
    if (this._element.nativeElement.localName === 'img') {
      this.renderer.setAttribute(this._element.nativeElement, 'data-src', this.fullSrc);
      this.renderer.setAttribute(this._element.nativeElement, 'src', this.lqip_img);
    } else {
      this.renderer.setAttribute(this._element.nativeElement, 'data-bg', this.fullSrc);
      this.renderer.setStyle(this._element.nativeElement, 'background-image', `url(${this.lqip_img})`);
    }
  }

  private swapToFull() {
    const el = this._element.nativeElement;
    if (el.localName === 'img') {
      this.renderer.setAttribute(el, 'src', this.fullSrc);
    } else {
      this.renderer.setStyle(el, 'background-image', `url(${this.fullSrc})`);
      // Background images don't fire `load` on the element — clear blur immediately.
      this.renderer.addClass(el, 'lazyloaded');
    }
  }

  /** Eager-promote when already in / near the viewport (ATF + Swiper slides). */
  private promoteIfNearViewport() {
    if (!this.observer || !this.fullSrc) return;
    const el = this._element.nativeElement as HTMLElement;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      // Layout not ready yet (common right after Swiper mounts) — retry once.
      setTimeout(() => this.promoteIfNearViewport(), 120);
      return;
    }
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    const vw = window.innerWidth || document.documentElement.clientWidth || 0;
    const near =
      rect.bottom > -200 &&
      rect.top < vh + 500 &&
      rect.right > -100 &&
      rect.left < vw + 100;
    if (near) {
      this.swapToFull();
      this.disconnect();
    }
  }

  onImgLoad() {
    // Fires for both the LQIP and the full image. Only treat full-image load as "loaded".
    const el = this._element.nativeElement;
    if (el.localName === 'img' && el.getAttribute('src') === this.fullSrc) {
      this.renderer.addClass(el, 'lazyloaded');
    }
  }

  private disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * Yourstore CDN images use `_s` LQIP + blur-up everything else loads at full fidelity immediately
   * (bundled `/assets`, relative `assets/`, or third-party origins).
   */
  private shouldBypassLqipBlur(src: string): boolean {
    if (!src?.trim()) return false;
    if (src.startsWith('/')) return true;
    if (src.startsWith('assets/')) return true;
    if (/^https?:\/\//i.test(src) && src.indexOf(environment.img_host) === -1) return true;
    return false;
  }

  /**
   * If the `_s` LQIP 404s, try the full image once. Only fall back to the SVG
   * placeholder when the full URL also fails (otherwise ATF cards stay broken).
   */
  placeholder() {
    const el = this._element.nativeElement as HTMLImageElement;
    const currentSrc = el.getAttribute('src') || '';
    if (
      this.fullSrc &&
      currentSrc !== this.fullSrc &&
      !currentSrc.includes('placeholder.svg')
    ) {
      this.renderer.setAttribute(el, 'src', this.fullSrc);
      this.disconnect();
      return;
    }
    this.lqip_img = 'assets/images/placeholder.svg';
    this.ImagelazyLoad = this.lqip_img;
    this.fullSrc = this.lqip_img;
    this.setInitialAttributes();
  }

}
