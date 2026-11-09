import { Directive, OnInit, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({ selector: '[bindQueryParamToInput]' })
export class BindQueryparamToInputDirective implements OnInit {
  private ngControl = inject(NgControl);

  readonly paramKey = input<string>(undefined, { alias: "bindQueryParamToInput" });

  ngOnInit() {
    const queryParams = new URLSearchParams(location.search);

    if (queryParams.has(this.paramKey())) {
      setTimeout(() => {
        this.ngControl.control.patchValue(queryParams.get(this.paramKey()));
      });
    }
  }

}