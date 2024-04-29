import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderAsc'
})

export class OrderAscPipe implements PipeTransform {

  transform(array: any, args: string): any {
    if (array !== undefined) {
      array.sort((a: any, b: any) => 0 - (a[args] > b[args] ? -1 : 1));
    }
    return array;
  }

}