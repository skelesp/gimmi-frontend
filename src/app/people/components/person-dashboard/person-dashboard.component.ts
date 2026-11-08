import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { User } from 'src/app/users/models/user.model';
import { UserService } from 'src/app/users/service/user.service';
import { IExtraPersonInfo, Person } from '../../models/person.model';
import { PeopleService } from '../../service/people.service';
import { NgIf } from '@angular/common';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { ShareComponent } from '../share/share.component';
import { CursorPointerDirective } from '../../../shared/directives/cursor-pointer.directive';
import { ExtraInfoComponent } from '../extra-info/extra-info.component';
import { WishListComponent } from '../../../wishes/components/wish-list/wish-list.component';

@Component({
    selector: 'gimmi-person-dashboard',
    templateUrl: './person-dashboard.component.html',
    styleUrls: ['./person-dashboard.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgIf, NgbAlert, ShareComponent, CursorPointerDirective, RouterLink, ExtraInfoComponent, WishListComponent]
})
export class PersonDashboardComponent implements OnInit {
  person : Person;
  currrentUser : User;
  personIsUser : boolean;

  constructor(
    private userService : UserService,
    private personService: PeopleService,
    private route : ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.userService.currentUser$.subscribe( (currentUser) => {
      this.currrentUser = currentUser;
    });

    this.route.data.subscribe( ( data ) => {
      this.person = data.person;
      this.personIsUser = this.personService.isEqualToCurrentUser(this.person);
    });
  }

  updateExtraInfo(extraInfo: IExtraPersonInfo) {
    this.person.extraInfo = extraInfo;
  }

}
