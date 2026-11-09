import { Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[click], [ngbDropdown], [routerLink]',
  host: { '[style.cursor]': 'cursor' }
})
export class CursorPointerDirective {
  private el = inject(ElementRef);


  cursor = 'pointer';

}
