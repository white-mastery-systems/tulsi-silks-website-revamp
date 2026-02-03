import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderAsc'
})

export class OrderAscPipe implements PipeTransform {

  transform(array: any, args: string): any {
    if (array && array !== undefined && Array.isArray(array)) {
      array.sort((a: any, b: any) => 0 - (a[args] > b[args] ? -1 : 1));
    }
    return array;
  }

}