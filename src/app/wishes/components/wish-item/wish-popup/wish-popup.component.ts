import { Component, Input, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal, NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { User } from 'src/app/users/models/user.model';
import { UserService } from 'src/app/users/service/user.service';
import { IWishImage, Wish } from 'src/app/wishes/models/wish.model';
import { WishService } from 'src/app/wishes/services/wish.service';
import { CursorPointerDirective } from '../../../../shared/directives/cursor-pointer.directive';

import { ImageUploadComponent } from '../../../../images/components/image-upload/image-upload.component';
import { ImageViewComponent } from '../../../../images/components/image-view/image-view.component';

@Component({
    selector: 'gimmi-wish-popup',
    templateUrl: './wish-popup.component.html',
    styleUrls: ['./wish-popup.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CursorPointerDirective, NgbAlert, FormsModule, ReactiveFormsModule, ImageUploadComponent, ImageViewComponent]
})
export class WishPopupComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  userService = inject(UserService);
  wishService = inject(WishService);

  @Input() wish: Wish = new Wish(null, null, null, null, null, null, null, null, null, 1);
  @Input() mode: 'edit' | 'create' | 'copy';
  wishForm: FormGroup<{
    title: FormControl<string | null>;
    price: FormControl<number | null>;
    image: FormControl<IWishImage | null>;
    url: FormControl<string | null>;
    color: FormControl<string | null>;
    size: FormControl<string | null>;
    description: FormControl<string | null>;
  }>;
  actionButtonText: string;
  popupTitle: string;
  saving = false;
  readonly showWarningExistingCopy = signal(false);
  currentUser: User;
  /** Voorvertoning van een net gekozen afbeelding, tot de popup sluit (sc-3028). */
  imagePreview: string = null;

  ngOnInit(): void {
    this.wishForm = new FormGroup({
      'title': new FormControl<string | null>(this.wish?.title, [Validators.required]),
      'price': new FormControl<number | null>(this.wish?.price),
      'image': new FormControl<IWishImage | null>(this.wish?.image),
      'url': new FormControl<string | null>(this.wish?.url),
      'color': new FormControl<string | null>(this.wish?.color),
      'size': new FormControl<string | null>(this.wish?.size),
      'description': new FormControl<string | null>(this.wish?.description)
    });
    
    this.setSaveButtonText();

    this.currentUser = this.userService.currentUser;

    if (this.mode === 'copy') {
      this.wishService.getCopiesOnListOf(this.wish.receiver).subscribe(receiversCopies => {
        if ( receiversCopies.find( w => w.copyOf === this.wish.copyOf ) ) {
          this.showWarningExistingCopy.set(true);
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
    const returnedWish = { ...this.wish, ...this.wishForm.value } as Wish;
    this.activeModal.close(returnedWish);    
  }

  cancel () {
    this.activeModal.dismiss('Cancel');
  }

}
