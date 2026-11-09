import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CursorPointer } from '../../../shared/directives/cursor-pointer';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'gimmi-forgot-password-link',
    template: `<a [routerLink]="['/users/forgotpassword']" 
                [queryParams]="{e:attemptedEmail()}">
                {{linkText()}}</a>`,
    styleUrls: ['./forgot-password-link.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CursorPointer, RouterLink]
})
export class ForgotPasswordLink {
  readonly attemptedEmail = input<string>(undefined);
  readonly linkText = input<string>(undefined);

}
