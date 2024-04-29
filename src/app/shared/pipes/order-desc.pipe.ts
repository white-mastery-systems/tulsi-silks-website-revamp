import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderDesc'
})

export class OrderDescPipe implements PipeTransform {

  transform(array: any, args: string): any {
    if (array !== undefined) {
      array.sort((a: any, b: any) => 0 - (a[args] > b[args] ? 1 : -1));
    }
    return array;
  }

}