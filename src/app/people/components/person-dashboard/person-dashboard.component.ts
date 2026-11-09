import { Component, ChangeDetectionStrategy, computed, inject, linkedSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UserService } from 'src/app/users/service/user.service';
import { IExtraPersonInfo, Person } from '../../models/person.model';
import { PeopleService } from '../../service/people.service';

import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { ShareComponent } from '../share/share.component';
import { CursorPointerDirective } from '../../../shared/directives/cursor-pointer.directive';
import { ExtraInfoComponent } from '../extra-info/extra-info.component';
import { WishListComponent } from '../../../wishes/components/wish-list/wish-list.component';

@Component({
    selector: 'gimmi-person-dashboard',
    templateUrl: './person-dashboard.component.html',
    styleUrls: ['./person-dashboard.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgbAlert, ShareComponent, CursorPointerDirective, RouterLink, ExtraInfoComponent, WishListComponent]
})
export class PersonDashboardComponent {
  private userService = inject(UserService);
  private personService = inject(PeopleService);
  private route = inject(ActivatedRoute);

  readonly currentUser = toSignal(this.userService.currentUser$);
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
