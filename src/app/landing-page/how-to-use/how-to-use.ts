import { NgOptimizedImage } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { faUserPlus, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { faListAlt, faPaperPlane } from "@fortawesome/free-regular-svg-icons";
import { AuthStore } from 'src/app/core/auth/auth-store';
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
    imports: [FaIconComponent, NgbTooltip, RouterLink, CursorPointer, Share, NgOptimizedImage]
})
export class HowToUse {
  private auth = inject(AuthStore);

  registerIcon : IconDefinition = faUserPlus;
  listIcon : IconDefinition = faListAlt;
  sendIcon : IconDefinition = faPaperPlane;
  readonly currentUser = this.auth.user;

}
