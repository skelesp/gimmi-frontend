import { Component, Input, OnDestroy, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { WishImage } from 'src/app/features/wishes/wish';
import { ChosenImage, ImagePicker } from '../image-picker/image-picker';

/**
 * "Choose image" button: opens the image picker as a popup (sc-3028) and passes on the
 * uploaded image. If the wish popup closes (this component disappears), the picker
 * closes too and a running upload is aborted (was sc-1391). Whoever leaves the page
 * closes all popups via the ModalsClosedGuard.
 *
 * Since sc-2911 every image gets its own key in R2: no temporary name
 * that has to be renamed or cleaned up afterwards.
 */
@Component({
    selector: 'gimmi-image-upload',
    templateUrl: './image-upload.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageUpload implements OnDestroy {
  private modalService = inject(NgbModal);

  @Input() searchTerm = "";

  readonly imageUploaded = output<WishImage>();
  /** Fires just before imageUploaded: a URL or data URI the browser can show right away. */
  readonly previewChanged = output<string>();

  private picker: NgbModalRef = null;

  openPicker(): void {
    this.picker = this.modalService.open(ImagePicker, { size: 'lg', scrollable: true, ariaLabelledBy: 'picker-title' });
    this.picker.componentInstance.searchTerm = this.searchTerm;
    this.picker.result.then(
      (chosen: ChosenImage) => {
        this.picker = null;
        this.previewChanged.emit(chosen.preview);
        this.imageUploaded.emit(chosen.image);
      },
      () => { this.picker = null; }   // cancelled or dismissed
    );
  }

  ngOnDestroy(): void {
    this.picker?.dismiss('Wish popup closed');
  }
}
