import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'rangeFilter'
})

export class RangeFilterPipe implements PipeTransform {

  transform(array: any, min: number, max: number): any {
    if(!array || array===undefined) { array = []; }
    if(!min || min===undefined) { min = 0; }
    if(!max || max===undefined) { max = 0; }
    let filteredArray = [];
    if(max > 0) {
      filteredArray = array.filter(obj => parseFloat(obj.temp_discounted_price) >= min && parseFloat(obj.temp_discounted_price) <= max);
    }
    else {
      filteredArray = array.filter(obj => parseFloat(obj.temp_discounted_price) >= min);
    }
    return filteredArray;
  }

}