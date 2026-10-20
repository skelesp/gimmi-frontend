import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CloudinaryService } from 'src/app/images/services/cloudinary.service';
import { User } from 'src/app/users/models/user.model';
import { UserService } from 'src/app/users/service/user.service';
import { IWishImage, Wish } from 'src/app/wishes/models/wish.model';
import { WishService } from 'src/app/wishes/services/wish.service';

@Component({
  selector: 'gimmi-wish-popup',
  templateUrl: './wish-popup.component.html',
  styleUrls: ['./wish-popup.component.css']
})
export class WishPopupComponent implements OnInit, OnDestroy {
  @Input() wish: Wish = new Wish(null, null, null, null, null, null, null, null, null, 1);
  @Input() mode: 'edit' | 'create' | 'copy';
  wishForm: FormGroup;
  actionButtonText: string;
  popupTitle: string;
  saving: boolean = false;
  showWarningExistingCopy: boolean = false;
  currentUser: User;
  /** Voorvertoning van een net gekozen afbeelding, tot de popup sluit (sc-3028). */
  imagePreview: string = null;

  constructor(
    public activeModal : NgbActiveModal,
    public userService : UserService,
    public imageService : CloudinaryService,
    public wishService : WishService
  ){}

  ngOnInit(): void {
    this.wishForm = new FormGroup({
      'title': new FormControl(this.wish?.title, [Validators.required]),
      'price': new FormControl(this.wish?.price),
      'image': new FormControl(this.wish?.image),
      'url': new FormControl(this.wish?.url),
      'color': new FormControl(this.wish?.color),
      'size': new FormControl(this.wish?.size),
      'description': new FormControl(this.wish?.description)
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
    let returnedWish: Wish = { ...this.wish, ...this.wishForm.value };
    this.activeModal.close(returnedWish);    
  }

  cancel () {
    this.activeModal.dismiss('Cancel');
  }

  private deleteTempWishImage ( image : IWishImage ) {
    if (this.imageService.isTemporaryImage(image)) {
      this.imageService.deleteImage(image).subscribe(result => {
        if (result) console.info(`Image ${image.publicId} is deleted from Cloudinary`);
        else console.info(`Image ${image.publicId} NOT deleted from Cloudinary`);
      })
    }
  }

  ngOnDestroy(): void {
    if (!this.saving && this.wishForm.value.image) {
      this.deleteTempWishImage(this.wishForm.value.image);
    }
  }
}
