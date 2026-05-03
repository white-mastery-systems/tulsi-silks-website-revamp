import { Directive, Input } from '@angular/core';

@Directive({
    selector: 'img[imgBroken]',
    host: {
        '(error)': 'updateUrl()',
        '[src]': 'src'
    },
    standalone: false
})

export class ImgBrokenDirective {

  @Input() src:string;

  updateUrl() {
    this.src = "assets/images/placeholder.svg";
  }

}