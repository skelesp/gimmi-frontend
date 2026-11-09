import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { faUserPlus, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { faListAlt, faPaperPlane } from "@fortawesome/free-regular-svg-icons";
import { UserService } from 'src/app/users/service/user.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap/tooltip';
import { RouterLink } from '@angular/router';
import { CursorPointerDirective } from '../../shared/directives/cursor-pointer.directive';

import { ShareComponent } from '../../people/components/share/share.component';

@Component({
    selector: 'gimmi-how-to-use',
    templateUrl: './how-to-use.component.html',
    styleUrls: ['./how-to-use.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FaIconComponent, NgbTooltip, RouterLink, CursorPointerDirective, ShareComponent]
})
export class HowToUseComponent {
  private userService = inject(UserService);

  registerIcon : IconDefinition = faUserPlus;
  listIcon : IconDefinition = faListAlt;
  sendIcon : IconDefinition = faPaperPlane;
  readonly currentUser = toSignal(this.userService.currentUser$);

}
