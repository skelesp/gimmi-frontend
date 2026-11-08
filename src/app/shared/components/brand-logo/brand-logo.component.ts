import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CursorPointerDirective } from '../../directives/cursor-pointer.directive';

@Component({
    selector: 'gimmi-brand-logo',
    templateUrl: './brand-logo.component.html',
    styleUrls: ['./brand-logo.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterLink, CursorPointerDirective]
})
export class BrandLogoComponent {
  @Input() link?: string[] = ["/"];

}
