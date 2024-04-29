import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'nestedSearch'
})

export class NestedSearchPipe implements PipeTransform {

  transform(list: any[], arrayName : string, field : string, value : string): any[] {
    if(!list) {
      return [{ notFound: true }];
    } 
    else if(!value || value.length == 0) {
      return list;
    }
    else {
      let filteredList = [];
      list.forEach((obj) => {
        let filteredOptions = obj[arrayName].filter(it => it[field].toLowerCase().indexOf(value.toLowerCase()) != -1);
        if(filteredOptions.length) filteredList.push(obj);
      })
      if(filteredList.length) return filteredList;
      else return [{ notFound: true }];
    }
  }

}