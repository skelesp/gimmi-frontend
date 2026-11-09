import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CursorPointerDirective } from '../../directives/cursor-pointer.directive';

@Component({
    selector: 'gimmi-brand-logo',
    templateUrl: './brand-logo.component.html',
    styleUrls: ['./brand-logo.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, CursorPointerDirective]
})
export class BrandLogoComponent {
  readonly link = input<string[]>(["/"]);

}
