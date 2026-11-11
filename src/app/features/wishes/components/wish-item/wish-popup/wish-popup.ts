import { Component, Input, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormField, form, required, submit, validate } from '@angular/forms/signals';
import { NgbActiveModal, NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { CurrentUser } from 'src/app/core/auth/auth-store';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { IWishImage, Wish } from 'src/app/features/wishes/models/wish.model';
import { WishesData } from 'src/app/features/wishes/wishes-data';
import { CursorPointer } from '../../../../../shared/directives/cursor-pointer';

import { ImageUpload } from '../../../../images/components/image-upload/image-upload';
import { ImageView } from '../../../../images/components/image-view/image-view';

@Component({
    selector: 'gimmi-wish-popup',
    templateUrl: './wish-popup.html',
    styleUrls: ['./wish-popup.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CursorPointer, NgbAlert, FormField, ImageUpload, ImageView]
})
export class WishPopup implements OnInit {
  activeModal = inject(NgbActiveModal);
  auth = inject(AuthStore);
  wishService = inject(WishesData);

  @Input() wish: Wish = new Wish(null, null, null, null, null, null, null, null, null, 1);
  @Input() mode: 'edit' | 'create' | 'copy';
  /** What the visitor types; the price stays text until saving, so an empty price is not `0`. */
  protected readonly wishFields = signal({ title: '', price: '', url: '', color: '', size: '', description: '' });
  protected readonly wishForm = form(this.wishFields, path => {
    required(path.title, { message: 'Titel is een verplicht veld' });
    validate(path.price, ({ value }) =>
      value().trim() && !(parsePrice(value()) >= 0) ? { kind: 'price', message: 'Geef een geldige prijs in (bv. 25 of 25,50).' } : undefined);
  });
  /** The chosen image is not typed in a field: the image upload hands it over. */
  readonly image = signal<IWishImage | undefined>(undefined);
  actionButtonText: string;
  popupTitle: string;
  saving = false;
  readonly showWarningExistingCopy = signal(false);
  currentUser: CurrentUser;
  /** Voorvertoning van een net gekozen afbeelding, tot de popup sluit (sc-3028). */
  imagePreview: string = null;

  ngOnInit(): void {
    this.wishFields.set({
      title: this.wish?.title ?? '',
      price: this.wish?.price == null ? '' : String(this.wish.price),
      url: this.wish?.url ?? '',
      color: this.wish?.color ?? '',
      size: this.wish?.size ?? '',
      description: this.wish?.description ?? ''
    });
    this.image.set(this.wish?.image ?? undefined);

    this.setSaveButtonText();

    this.currentUser = this.auth.user();

    // The server says whether the viewer already has a copy of this wish on their own list.
    if (this.mode === 'copy' && this.wish.viewer?.ownCopyId) {
      this.showWarningExistingCopy.set(true);
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
    this.image.set(newImage);
  }

  saveWish (event?: Event): Promise<boolean> {
    event?.preventDefault();
    return submit(this.wishForm, async () => {
      this.saving = true;
      const { price, ...fields } = this.wishFields();
      const returnedWish = { ...this.wish, ...fields, price: price.trim() ? parsePrice(price) : null, image: this.image() } as Wish;
      this.activeModal.close(returnedWish);
    });
  }

  cancel () {
    this.activeModal.dismiss('Cancel');
  }

}

/** A price as typed, with a comma or a point as decimal separator; `NaN` when it is not a number. */
function parsePrice(text: string): number {
  return /^\d+([.,]\d{1,2})?$/.test(text.trim()) ? Number(text.trim().replace(',', '.')) : NaN;
}
