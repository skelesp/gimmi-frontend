import { Pipe, PipeTransform } from '@angular/core';
import { Wish, WishStatus } from '../wish';

@Pipe({
    name: 'filterOnState',
    pure: false
})
export class FilterOnStatePipe implements PipeTransform {

  transform(wishes: Wish[], stateFilter: WishStatus[]): Wish[] {
    if ( !wishes || !stateFilter) {
      return wishes;
    }
    return wishes.filter(wish => stateFilter.indexOf(wish.status) !== -1);
  }

}
