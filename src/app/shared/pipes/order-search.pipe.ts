import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderSearch'
})

export class OrderSearchPipe implements PipeTransform {

  transform(items: any[], field : string, value : string): any[] {
    if(!items) {
      return [{ notFound: true }];
    } 
    else if(!value || value.length == 0) {
      return items;
    }
    else {
      let filterItems = items.filter(it => it[field].toLowerCase().indexOf(value.toLowerCase()) != -1);
      if(filterItems.length) return filterItems;
      else return [{ notFound: true }];
    }
  }

}