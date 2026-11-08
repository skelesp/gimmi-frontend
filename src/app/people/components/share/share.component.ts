import { Component, Input } from '@angular/core';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faShareAlt } from '@fortawesome/free-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from 'src/environments/environment';
import { Person } from '../../models/person.model';
import { SharePopupComponent } from './share-popup/share-popup.component';

@Component({
    selector: 'gimmi-share',
    templateUrl: './share.component.html',
    styleUrls: ['./share.component.css'],
    standalone: false
})
export class ShareComponent {
  @Input() personToShare: Person;
  @Input() shareIcon: IconDefinition = faShareAlt;
  @Input() iconSize: string = "lg";

  constructor(
    private modalService: NgbModal
  ) { }

  activate() {
    let sharePopup = this.modalService.open(SharePopupComponent);
    sharePopup.componentInstance.linkToShare = environment.rootSiteUrl + '/people/' + this.personToShare?.id;
    sharePopup.componentInstance.personToShare = this.personToShare;
  }

}
