import { Component, ChangeDetectionStrategy } from '@angular/core';
import { faSignInAlt, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { CursorPointerDirective } from '../../../shared/directives/cursor-pointer.directive';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'gimmi-unknown-user-menu',
    templateUrl: './unknown-user-menu.component.html',
    styleUrls: ['./unknown-user-menu.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CursorPointerDirective, RouterLink, FaIconComponent]
})
export class UnknownUserMenuComponent {  
  registerIcon = faUserPlus;
  loginIcon = faSignInAlt;

}
