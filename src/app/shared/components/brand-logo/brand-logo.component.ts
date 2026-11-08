import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'gimmi-brand-logo',
    templateUrl: './brand-logo.component.html',
    styleUrls: ['./brand-logo.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class BrandLogoComponent {
  @Input() link?: string[] = ["/"];

}
