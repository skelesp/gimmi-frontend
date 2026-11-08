import { Directive, ElementRef, HostBinding } from '@angular/core';

@Directive({ selector: '[click], [ngbDropdown], [routerLink]' })
export class CursorPointerDirective {

  constructor(private el: ElementRef) { }

  @HostBinding('style.cursor') cursor = 'pointer';

}
