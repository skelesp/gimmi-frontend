import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { faUserPlus, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { faListAlt, faPaperPlane } from "@fortawesome/free-regular-svg-icons";
import { UserService } from 'src/app/users/service/user.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap/tooltip';
import { RouterLink } from '@angular/router';
import { CursorPointer } from '../../shared/directives/cursor-pointer';

import { Share } from '../../people/components/share/share';

@Component({
    selector: 'gimmi-how-to-use',
    templateUrl: './how-to-use.html',
    styleUrls: ['./how-to-use.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FaIconComponent, NgbTooltip, RouterLink, CursorPointer, Share]
})
export class HowToUse {
  private userService = inject(UserService);

  registerIcon : IconDefinition = faUserPlus;
  listIcon : IconDefinition = faListAlt;
  sendIcon : IconDefinition = faPaperPlane;
  readonly currentUser = toSignal(this.userService.currentUser$);

}
