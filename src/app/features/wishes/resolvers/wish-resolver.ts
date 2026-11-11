import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Wish } from '../models/wish.model';
import { WishesData } from '../wishes-data';

export const wishResolver: ResolveFn<Wish> = (route) => {
  return inject(WishesData).getWishById(route.paramMap.get('wishId'))
    .pipe(
      catchError(() => { 
        console.error(`[wish resolver] Error in getting wish by ID.`)
        return of(null); })
    );
};
