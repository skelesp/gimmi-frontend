import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { User } from 'src/app/users/models/user.model';
import { UserService } from 'src/app/users/service/user.service';
import { IWishImage, Wish } from 'src/app/wishes/models/wish.model';
import { WishService } from 'src/app/wishes/services/wish.service';

@Component({
    selector: 'gimmi-wish-popup',
    templateUrl: './wish-popup.component.html',
    styleUrls: ['./wish-popup.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class WishPopupComponent implements OnInit {
  @Input() wish: Wish = new Wish(null, null, null, null, null, null, null, null, null, 1);
  @Input() mode: 'edit' | 'create' | 'copy';
  wishForm: UntypedFormGroup;
  actionButtonText: string;
  popupTitle: string;
  saving = false;
  showWarningExistingCopy = false;
  currentUser: User;
  /** Voorvertoning van een net gekozen afbeelding, tot de popup sluit (sc-3028). */
  imagePreview: string = null;

  constructor(
    public activeModal : NgbActiveModal,
    public userService : UserService,
    public wishService : WishService
  ){}

  ngOnInit(): void {
    this.wishForm = new UntypedFormGroup({
      'title': new UntypedFormControl(this.wish?.title, [Validators.required]),
      'price': new UntypedFormControl(this.wish?.price),
      'image': new UntypedFormControl(this.wish?.image),
      'url': new UntypedFormControl(this.wish?.url),
      'color': new UntypedFormControl(this.wish?.color),
      'size': new UntypedFormControl(this.wish?.size),
      'description': new UntypedFormControl(this.wish?.description)
    });
    
    this.setSaveButtonText();

    this.currentUser = this.userService.currentUser;

    if (this.mode === 'copy') {
      this.wishService.getCopiesOnListOf(this.wish.receiver).subscribe(receiversCopies => {
        if ( receiversCopies.find( w => w.copyOf === this.wish.copyOf ) ) {
          this.showWarningExistingCopy = true;
        }
      })
    }
  }

  private setSaveButtonText () {
    switch (this.mode) {
      case 'create':
        this.actionButtonText = "Wens toevoegen";
        this.popupTitle = "Voeg een wens toe";
        break;
      case 'edit':
        this.actionButtonText = "Wens aanpassen";
        this.popupTitle = "Pas deze wens aan";
        break;
      case 'copy':
        this.actionButtonText = "Wens kopiëren";
        this.popupTitle = "Kopieer deze wens op je lijst";
        break;
      default:
        this.actionButtonText = "Wens opslaan";
        this.popupTitle = "Pas deze wens aan";
        break;
    }
  }

  updateWishImage(newImage: IWishImage) {
    this.wishForm.get("image").setValue(newImage);
  }

  saveWish () {
    this.saving = true;
    const returnedWish: Wish = { ...this.wish, ...this.wishForm.value };
    this.activeModal.close(returnedWish);    
  }

  cancel () {
    this.activeModal.dismiss('Cancel');
  }

}
