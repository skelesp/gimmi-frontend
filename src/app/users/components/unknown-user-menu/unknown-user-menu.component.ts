import { Component } from '@angular/core';
import { faSignInAlt, faUserPlus } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'gimmi-unknown-user-menu',
    templateUrl: './unknown-user-menu.component.html',
    styleUrls: ['./unknown-user-menu.component.css'],
    standalone: false
})
export class UnknownUserMenuComponent {  
  registerIcon = faUserPlus;
  loginIcon = faSignInAlt;

}
