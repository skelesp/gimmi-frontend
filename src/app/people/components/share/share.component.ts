import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faShareAlt } from '@fortawesome/free-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from 'src/environments/environment';
import { Person } from '../../models/person.model';
import { SharePopupComponent } from './share-popup/share-popup.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CursorPointerDirective } from '../../../shared/directives/cursor-pointer.directive';

@Component({
    selector: 'gimmi-share',
    templateUrl: './share.component.html',
    styleUrls: ['./share.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [FaIconComponent, CursorPointerDirective]
})
export class ShareComponent {
  private modalService = inject(NgbModal);

  @Input() personToShare: Person;
  @Input() shareIcon: IconDefinition = faShareAlt;
  @Input() iconSize = "lg";

  activate() {
    const sharePopup = this.modalService.open(SharePopupComponent);
    sharePopup.componentInstance.linkToShare = environment.rootSiteUrl + '/people/' + this.personToShare?.id;
    sharePopup.componentInstance.personToShare = this.personToShare;
  }

}
