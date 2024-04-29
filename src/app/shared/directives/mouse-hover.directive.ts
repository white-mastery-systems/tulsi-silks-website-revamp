import { Directive, ElementRef, Renderer2, HostListener } from '@angular/core';

@Directive({
  selector: '[appMouseHover]'
})

export class MouseHoverDirective {

  constructor(private elementRef:ElementRef, private renderer:Renderer2) { }

  @HostListener('mouseenter') mouseover() {
    this.elementRef.nativeElement.querySelectorAll("img").forEach(element => {
      element.classList.remove("blur-up");
      element.classList.remove("lq-blur-up");
    });
  }

}