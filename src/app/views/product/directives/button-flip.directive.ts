import {
  Directive,
  ElementRef,
  AfterViewInit,
  OnDestroy
} from '@angular/core';

@Directive({
    selector: '[appButtonFlip]',
    standalone: false
})
export class ButtonFlipDirective implements AfterViewInit, OnDestroy {
  
  private carouselEl!: HTMLElement;
  private onIteration: any;

  constructor(private el: ElementRef) { }

  ngAfterViewInit(): void {
    // Select the inner <div> inside #wordCarousel
    this.carouselEl = this.el.nativeElement.querySelector('div');

    if (this.carouselEl) {
      // Bind to animationiteration
      this.onIteration = () => {
        if (this.carouselEl.children.length) {
          this.carouselEl.appendChild(this.carouselEl.children[0]);
        }
      };
      this.carouselEl.addEventListener('animationiteration', this.onIteration);
    }
  }

  ngOnDestroy(): void {
    if (this.carouselEl && this.onIteration) {
      this.carouselEl.removeEventListener('animationiteration', this.onIteration);
    }
  }
}
