import { Component, ChangeDetectionStrategy } from '@angular/core';
import { faSignInAlt, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { CursorPointer } from '../../../shared/directives/cursor-pointer';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'gimmi-unknown-user-menu',
    templateUrl: './unknown-user-menu.html',
    styleUrls: ['./unknown-user-menu.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CursorPointer, RouterLink, FaIconComponent]
})
export class UnknownUserMenu {  
  registerIcon = faUserPlus;
  loginIcon = faSignInAlt;

}
