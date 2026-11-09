import { NgOptimizedImage } from '@angular/common';
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CursorPointer } from '../../directives/cursor-pointer';

@Component({
    selector: 'gimmi-brand-logo',
    templateUrl: './brand-logo.html',
    styleUrls: ['./brand-logo.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, CursorPointer, NgOptimizedImage]
})
export class BrandLogo {
  readonly link = input<string[]>(["/"]);

}
