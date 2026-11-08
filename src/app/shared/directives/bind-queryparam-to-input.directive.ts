import { Directive, Input } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
    selector: '[bindQueryParamToInput]',
    standalone: false
})
export class BindQueryparamToInputDirective {
  @Input('bindQueryParamToInput') paramKey: string;

  constructor( 
    private ngControl : NgControl
    ) { }

  ngOnInit() {
    const queryParams = new URLSearchParams(location.search);

    if (queryParams.has(this.paramKey)) {
      setTimeout(() => {
        this.ngControl.control.patchValue(queryParams.get(this.paramKey));
      });
    }
  }

}