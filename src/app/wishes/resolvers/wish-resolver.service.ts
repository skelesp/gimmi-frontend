import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Wish } from '../models/wish.model';
import { WishService } from '../services/wish.service';

@Injectable({
  providedIn: 'root'
})
export class WishResolver {

  constructor(
    private wishService : WishService
  ) { }

  resolve ( route : ActivatedRouteSnapshot, state: RouterStateSnapshot) : Observable<Wish> {
    return this.wishService.getWishById(route.paramMap.get('wishId'))
      .pipe(
        catchError(() => { 
          console.error(`[wish resolver] Error in getting wish by ID.`)
          return of(null); })
      );
  }
}
