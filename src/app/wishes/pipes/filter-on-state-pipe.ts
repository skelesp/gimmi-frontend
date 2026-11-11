import { Pipe, PipeTransform } from '@angular/core';
import { Wish, wishStatus } from '../models/wish.model';

@Pipe({
    name: 'filterOnState',
    pure: false
})
export class FilterOnStatePipe implements PipeTransform {

  transform(wishes: Wish[], stateFilter: wishStatus[]): Wish[] {
    if ( !wishes || !stateFilter) {
      return wishes;
    }
    return wishes.filter(wish => stateFilter.indexOf(wish.status) !== -1);
  }

}
