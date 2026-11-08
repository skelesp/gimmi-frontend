import { Directive, Input, OnInit, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({ selector: '[bindQueryParamToInput]' })
export class BindQueryparamToInputDirective implements OnInit {
  private ngControl = inject(NgControl);

  @Input('bindQueryParamToInput') paramKey: string;

  ngOnInit() {
    const queryParams = new URLSearchParams(location.search);

    if (queryParams.has(this.paramKey)) {
      setTimeout(() => {
        this.ngControl.control.patchValue(queryParams.get(this.paramKey));
      });
    }
  }

}