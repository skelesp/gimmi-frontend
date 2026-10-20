import { Component, Input, OnChanges } from '@angular/core';
import { IWishImage } from 'src/app/wishes/models/wish.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'gimmi-image-view',
  templateUrl: './image-view.component.html',
  styleUrls: ['./image-view.component.css']
})
export class ImageViewComponent implements OnChanges {
  @Input() image : IWishImage = environment.cloudinary.defaultImage;
  @Input() class : string = "";
  /**
   * Toon deze URL of data-URI in plaats van de Cloudinary-afbeelding (sc-3028): net na het
   * kiezen heeft de browser de nieuwe afbeelding al, terwijl Cloudinary ze nog moet leveren.
   */
  @Input() preview : string = null;

  constructor() { }

  ngOnChanges(): void {
    if (!this.image || !this.image.publicId) this.image = environment.cloudinary.defaultImage;
  }

}
