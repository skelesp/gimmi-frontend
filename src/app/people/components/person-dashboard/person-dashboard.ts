import { Component, ChangeDetectionStrategy, computed, inject, linkedSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { Person } from '../../models/person.model';
import { PersonProfile } from '../../service/people';

import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { Share } from '../share/share';
import { CursorPointer } from '../../../shared/directives/cursor-pointer';
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
  private readonly routeProfile = toSignal(this.route.data.pipe(map(data => data.person as PersonProfile | null)));
  /** The profile from the route; replaced by the answer when the likes and dislikes are saved. */
  readonly profile = linkedSignal(() => this.routeProfile());
  readonly personIsUser = computed(() => this.profile()?.viewer.isSelf ?? false);
  readonly canEdit = computed(() => this.profile()?.viewer.can.update ?? false);
  /**
   * The person as the (v1) wish list wants it. The same object for the same person, so saving the likes
   * does not reload the wishes. Goes away with sc-3288.
   */
  readonly receiver = computed(() => {
    const profile = this.profile();
    return profile ? new Person(profile.id, profile.firstName, profile.lastName) : null;
  }, { equal: (a, b) => a?.id === b?.id });

  updateProfile(profile: PersonProfile) {
    this.profile.set(profile);
  }
}
