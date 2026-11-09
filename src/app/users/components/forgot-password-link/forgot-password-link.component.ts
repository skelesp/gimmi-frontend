import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CursorPointerDirective } from '../../../shared/directives/cursor-pointer.directive';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'gimmi-forgot-password-link',
    template: `<a [routerLink]="['/users/forgotpassword']" 
                [queryParams]="{e:attemptedEmail()}">
                {{linkText()}}</a>`,
    styleUrls: ['./forgot-password-link.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [CursorPointerDirective, RouterLink]
})
export class ForgotPasswordLinkComponent {
  readonly attemptedEmail = input<string>(undefined);
  readonly linkText = input<string>(undefined);

}
