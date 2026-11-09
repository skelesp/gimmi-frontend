import { Component, ChangeDetectionStrategy, computed, inject, linkedSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { IExtraPersonInfo, Person } from '../../models/person.model';
import { PeopleService } from '../../service/people.service';

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
  private personService = inject(PeopleService);
  private route = inject(ActivatedRoute);

  readonly currentUser = this.auth.user;
  private readonly routePerson = toSignal(this.route.data.pipe(map(data => data.person as Person)));
  // Altijd "gewijzigd": updateExtraInfo muteert de persoon, en dat moet de weergave verversen.
  readonly person = linkedSignal<Person, Person>({ source: this.routePerson, computation: person => person, equal: () => false });
  readonly personIsUser = computed(() => this.personService.isEqualToCurrentUser(this.person()));

  updateExtraInfo(extraInfo: IExtraPersonInfo) {
    this.person.update(person => {
      person.extraInfo = extraInfo;
      return person;
    });
  }

}
