import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'productSort'
})

export class ProductSortPipe implements PipeTransform {

  transform(array: any, args: string): any {
    if(args=='latest') array.sort((a, b) => 0 - (a.rank > b.rank ? 1 : -1));
    else if(args=='discounted') array.sort((a, b) => 0 - (a.disc_status > b.disc_status ? 1 : -1));
    else if(args=='price_desc') array.sort((a, b) => 0 - (a.discounted_price > b.discounted_price ? 1 : -1));
    else if(args=='price_asc') array.sort((a, b) => 0 - (a.discounted_price > b.discounted_price ? -1 : 1));
    return array;
  }

}