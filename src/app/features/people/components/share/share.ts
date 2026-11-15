import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { IconDefinition, SizeProp } from '@fortawesome/fontawesome-svg-core';
import { faShareAlt } from '@fortawesome/free-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from 'src/environments/environment';
import { PersonToShare } from '../../models/person.model';
import { SharePopup } from './share-popup/share-popup';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CursorPointer } from '../../../../shared/directives/cursor-pointer';

@Component({
    selector: 'gimmi-share',
    templateUrl: './share.html',
    styleUrls: ['./share.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FaIconComponent, CursorPointer]
})
export class Share {
  private modalService = inject(NgbModal);

  readonly personToShare = input<PersonToShare>(undefined);
  readonly shareIcon = input<IconDefinition>(faShareAlt);
  readonly iconSize = input<SizeProp>("lg");

  activate() {
    const sharePopup = this.modalService.open(SharePopup);
    const personToShare = this.personToShare();
    sharePopup.componentInstance.linkToShare = environment.rootSiteUrl + '/people/' + personToShare?.id;
    sharePopup.componentInstance.personToShare = personToShare;
  }

}
