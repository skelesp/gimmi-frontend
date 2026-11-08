import { Directive, ElementRef, HostBinding, inject } from '@angular/core';

@Directive({ selector: '[click], [ngbDropdown], [routerLink]' })
export class CursorPointerDirective {
  private el = inject(ElementRef);


  @HostBinding('style.cursor') cursor = 'pointer';

}
