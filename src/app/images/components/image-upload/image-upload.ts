import { Component, Input, OnDestroy, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { IWishImage } from 'src/app/wishes/models/wish.model';
import { IGekozenAfbeelding, ImagePicker } from '../image-picker/image-picker';

/**
 * Knop "Kies afbeelding": opent de afbeeldingskiezer als popup (sc-3028) en geeft de
 * opgeladen afbeelding door. Sluit de wens-popup (deze component verdwijnt), dan sluit
 * de kiezer mee en breekt een lopende upload af (was sc-1391). Wie de pagina verlaat,
 * sluit alle popups via de ModalsClosedGuard.
 *
 * Sinds sc-2911 krijgt elke afbeelding een eigen sleutel in R2: geen tijdelijke naam
 * meer die achteraf hernoemd of opgeruimd moet worden.
 */
@Component({
    selector: 'gimmi-image-upload',
    templateUrl: './image-upload.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageUpload implements OnDestroy {
  private modalService = inject(NgbModal);

  @Input() searchTerm = "";

  readonly imageUploaded = output<IWishImage>();
  /** Komt vlak vóór imageUploaded: een URL of data-URI die de browser meteen kan tonen. */
  readonly previewChanged = output<string>();

  private kiezer: NgbModalRef = null;

  openKiezer(): void {
    this.kiezer = this.modalService.open(ImagePicker, { size: 'lg', scrollable: true, ariaLabelledBy: 'kiezer-titel' });
    this.kiezer.componentInstance.searchTerm = this.searchTerm;
    this.kiezer.result.then(
      (gekozen: IGekozenAfbeelding) => {
        this.kiezer = null;
        this.previewChanged.emit(gekozen.voorvertoning);
        this.imageUploaded.emit(gekozen.afbeelding);
      },
      () => { this.kiezer = null; }   // geannuleerd of weggeklikt
    );
  }

  ngOnDestroy(): void {
    this.kiezer?.dismiss('Wens-popup gesloten');
  }
}
