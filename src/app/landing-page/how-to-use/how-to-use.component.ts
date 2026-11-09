import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { faUserPlus, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { faListAlt, faPaperPlane } from "@fortawesome/free-regular-svg-icons";
import { UserService } from 'src/app/users/service/user.service';
import { User } from 'src/app/users/models/user.model';
import { Subscription } from 'rxjs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap/tooltip';
import { RouterLink } from '@angular/router';
import { CursorPointerDirective } from '../../shared/directives/cursor-pointer.directive';

import { ShareComponent } from '../../people/components/share/share.component';

@Component({
    selector: 'gimmi-how-to-use',
    templateUrl: './how-to-use.component.html',
    styleUrls: ['./how-to-use.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [FaIconComponent, NgbTooltip, RouterLink, CursorPointerDirective, ShareComponent]
})
export class HowToUseComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);

  registerIcon : IconDefinition = faUserPlus;
  listIcon : IconDefinition = faListAlt;
  sendIcon : IconDefinition = faPaperPlane;
  currentUser : User;
  currentUserSubscription : Subscription;

  ngOnInit(): void {
    this.currentUserSubscription = this.userService.currentUser$.subscribe( user => {
      this.currentUser = user;
    });
  }

  ngOnDestroy(): void {
    this.currentUserSubscription.unsubscribe();
  }

}
