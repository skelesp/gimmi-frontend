import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { IWishImage } from 'src/app/wishes/models/wish.model';
import { environment } from 'src/environments/environment';
import { CloudinaryService } from '../../services/cloudinary.service';
import { ImagePickerComponent } from '../image-picker/image-picker.component';

/**
 * Knop "Kies afbeelding": opent de afbeeldingskiezer als popup (sc-3028) en geeft de
 * opgeladen afbeelding door. Sluit de wens-popup (deze component verdwijnt), dan sluit
 * de kiezer mee en breekt een lopende upload af (was sc-1391). Wie de pagina verlaat,
 * sluit alle popups via de ModalsClosedGuard.
 */
@Component({
  selector: 'gimmi-image-upload',
  templateUrl: './image-upload.component.html'
})
export class ImageUploadComponent implements OnInit, OnDestroy {
  @Input() publicId: string;
  @Input() tempPublicId_prefix: string = "";
  @Input() tempPublicId_postfix: string = environment.cloudinary.temporaryImagePostfix;
  @Input() searchTerm: string = "";

  @Output() imageUploaded: EventEmitter<IWishImage> = new EventEmitter();

  private doelPublicId: string;
  private kiezer: NgbModalRef = null;

  constructor(
    private cloudinaryService: CloudinaryService,
    private modalService: NgbModal) { }

  ngOnInit(): void {
    this.doelPublicId = this.publicId ? this.publicId : this.cloudinaryService.generateRandomPublicId(this.tempPublicId_prefix, this.tempPublicId_postfix);
  }

  openKiezer(): void {
    this.kiezer = this.modalService.open(ImagePickerComponent, { size: 'lg', scrollable: true, ariaLabelledBy: 'kiezer-titel' });
    this.kiezer.componentInstance.publicId = this.doelPublicId;
    this.kiezer.componentInstance.searchTerm = this.searchTerm;
    this.kiezer.result.then(
      (afbeelding: IWishImage) => {
        this.kiezer = null;
        this.imageUploaded.emit(afbeelding);
      },
      () => { this.kiezer = null; }   // geannuleerd of weggeklikt
    );
  }

  ngOnDestroy(): void {
    this.kiezer?.dismiss('Wens-popup gesloten');
  }
}
