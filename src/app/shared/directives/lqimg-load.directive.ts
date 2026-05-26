import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * LQIP (Low-Quality Image Placeholder) setup directive.
 *
 * Sets up the initial blurred placeholder + `data-src` pointing at the `_s` (small) variant
 * so the page shows a tiny preview immediately. The actual lazy-swap to the full-resolution
 * image is handled by the sibling `appDeferLoad` directive — see
 * `defer-load.directive.ts` — which is always paired with `appLqimgLoad` in templates.
 *
 * Originally this directive also did the swap itself via `lazysizes`. After the
 * `lazysizes` removal (perf sprint Day 1), two competing IntersectionObservers in
 * `LqimgLoad` and `DeferLoad` would race and the loser would *override* the winner —
 * which is what caused the "first image stayed at low-quality _s variant" regression.
 * Fix: keep only `DeferLoad` as the intersection-swap owner; `LqimgLoad` becomes a
 * pure setup directive.
 */
@Directive({
    selector: '[appLqimgLoad]',
    host: { '(error)': 'placeholder()', '(load)': 'addBlur()' },
    standalone: false
})

export class LqimgLoadDirective implements OnInit {

  @Input() ImagelazyLoad: any;
  public lqip_img : any;

  constructor(
    private _element: ElementRef,
    private renderer: Renderer2
  ) { }

  ngOnInit() {
    this.lqip_img = "assets/images/placeholder.svg";
    this.setAttributes();
  }

  setAttributes() {
    let imgPathName = "assets/images/placeholder.svg";
    let imgArray = this.ImagelazyLoad.split(environment.img_host);
    if (imgArray.length == 2) imgPathName = environment.img_host + imgArray[1].split('.').join('_s.');

    this.renderer.addClass(this._element.nativeElement, 'lazyload');

    const objImg: any = this._element.nativeElement;
    objImg.src = this.ImagelazyLoad;
    if (objImg.complete) {
      imgPathName = this.ImagelazyLoad;
      this.lqip_img = this.ImagelazyLoad;
    }

    if (this._element.nativeElement.localName === 'img') {
      this.renderer.setAttribute(this._element.nativeElement, 'data-src', imgPathName);
      this.renderer.setAttribute(this._element.nativeElement, 'src', this.lqip_img);
    } else {
      this.renderer.setAttribute(this._element.nativeElement, 'data-bg', imgPathName);
      this.renderer.setStyle(this._element.nativeElement, 'background-image', `url(${this.lqip_img})`);
    }
  }

  placeholder() {
    this.lqip_img = "assets/images/placeholder.svg";
    this.ImagelazyLoad = "assets/images/placeholder.svg";
    this.setAttributes();
  }

  addBlur() {
    if (this._element.nativeElement.src.indexOf('assets/images/placeholder.svg') === -1) {
      this.renderer.addClass(this._element.nativeElement, 'lq-blur-up');
    }
  }

}
