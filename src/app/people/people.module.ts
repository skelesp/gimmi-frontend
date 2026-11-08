import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';

import { PeopleRoutingModule } from './people-routing.module';
import { PeopleSearchComponent } from './components/people-search/people-search.component';
import { InviteComponent } from './components/invite/invite.component';
import { PersonDashboardComponent } from './components/person-dashboard/person-dashboard.component';
import { WishesModule } from '../wishes/wishes.module';
import { ExtraInfoComponent } from './components/extra-info/extra-info.component';
import { ExtraInfoViewComponent } from './components/extra-info/extra-info-view/extra-info-view.component';
import { ExtraInfoEditComponent } from './components/extra-info/extra-info-edit/extra-info-edit.component';
import { ShareComponent } from './components/share/share.component';
import { SharePopupComponent } from './components/share/share-popup/share-popup.component';
import { WhatsappButtonComponent } from './components/share/whatsapp-button/whatsapp-button.component';
import { CopyToClipboardButtonComponent } from './components/share/copy-to-clipboard-button/copy-to-clipboard-button.component';
import { MailToButtonComponent } from './components/share/mail-to-button/mail-to-button.component';

@NgModule({
  declarations: [
    PeopleSearchComponent,
    InviteComponent,
    PersonDashboardComponent,
    ExtraInfoComponent,
    ExtraInfoViewComponent,
    ExtraInfoEditComponent,
    ShareComponent,
    SharePopupComponent,
    WhatsappButtonComponent,
    CopyToClipboardButtonComponent,
    MailToButtonComponent
  ],
  imports: [
    SharedModule,
    PeopleRoutingModule,
    WishesModule
  ],
  exports: [
    PeopleSearchComponent,
    InviteComponent,
    ShareComponent
  ]
})
export class PeopleModule { }
