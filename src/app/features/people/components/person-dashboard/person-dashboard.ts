import { Component, ChangeDetectionStrategy, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { PageTitle } from 'src/app/core/page-title';
import { People, PersonProfile } from '../../service/people';

import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { Share } from '../share/share';
import { CursorPointer } from '../../../../shared/directives/cursor-pointer';
import { ExtraInfo } from '../extra-info/extra-info';
import { WishList } from '../../../wishes/components/wish-list/wish-list';

@Component({
    selector: 'gimmi-person-dashboard',
    templateUrl: './person-dashboard.html',
    styleUrls: ['./person-dashboard.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgbAlert, Share, CursorPointer, RouterLink, ExtraInfo, WishList]
})
export class PersonDashboard {
  private auth = inject(AuthStore);
  private route = inject(ActivatedRoute);

  readonly currentUser = this.auth.user;
  private readonly personId = toSignal(this.route.paramMap.pipe(map(params => params.get('personId'))));
  private readonly profileResource = inject(People).profile(this.personId);
  readonly loading = this.profileResource.isLoading;
  /** The profile of the person in the route, or `null` while it loads and when it cannot be shown. */
  readonly profile = computed(() => this.profileResource.hasValue() ? this.profileResource.value() : null);
  readonly personIsUser = computed(() => this.profile()?.viewer.isSelf ?? false);
  readonly canEdit = computed(() => this.profile()?.viewer.can.update ?? false);
  /** The person whose list is shown. The same object for the same person, so saving the likes does not reload the wishes. */
  readonly receiver = computed(() => {
    const profile = this.profile();
    return profile ? { id: profile.id, firstName: profile.firstName, lastName: profile.lastName } : null;
  }, { equal: (a, b) => a?.id === b?.id });

  constructor() {
    const pageTitle = inject(PageTitle);
    effect(() => {
      const profile = this.profile();
      if (profile) {
        pageTitle.set(this.personIsUser() ? 'Mijn wensenlijst' : `Wensenlijst van ${profile.firstName} ${profile.lastName}`);
      }
    });
  }

  /** Shows the answer of saving the likes and dislikes, without reading the profile again. */
  updateProfile(profile: PersonProfile) {
    this.profileResource.value.set(profile);
  }
}
