import { Directive, ElementRef, inject } from '@angular/core';

@Directive({
  // It attaches to the attributes of other directives, so the selector has no `gimmi` prefix.
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[click], [ngbDropdown], [routerLink]',
  host: { '[style.cursor]': 'cursor' }
})
export class CursorPointer {
  private el = inject(ElementRef);


  cursor = 'pointer';

}
