import { Component, Input, OnChanges } from '@angular/core';
import { IWishImage } from 'src/app/wishes/models/wish.model';
import { ImageService, STANDAARD_AFBEELDING } from '../../services/image.service';

/**
 * Toont de afbeelding van een wens (sc-2911): een gewone <img> met srcset, zodat de browser
 * een passende breedte haalt (Cloudflare Image Transformations voor R2, Cloudinary voor nog
 * niet gemigreerde beelden). Vaste verhouding 3:2 en een lichte achtergrond tijdens het laden,
 * zodat de kaarten niet verspringen (was sc-2632). Laadt het beeld niet, dan de standaardafbeelding.
 */
@Component({
  selector: 'gimmi-image-view',
  templateUrl: './image-view.component.html',
  styleUrls: ['./image-view.component.css']
})
export class ImageViewComponent implements OnChanges {
  @Input() image : IWishImage = null;
  @Input() class : string = "";
  /** Hoe breed het beeld getoond wordt, voor de keuze uit de srcset. */
  @Input() sizes : string = "(max-width: 574px) 50vw, (max-width: 766px) 33vw, 25vw";
  /**
   * Toon deze URL of data-URI in plaats van het opgeslagen beeld (sc-3028): net na het
   * kiezen heeft de browser de nieuwe afbeelding al.
   */
  @Input() preview : string = null;

  src: string = STANDAARD_AFBEELDING;
  srcset: string = null;

  constructor(private imageService: ImageService) { }

  ngOnChanges(): void {
    this.src = this.imageService.src(this.image, 640);
    this.srcset = this.imageService.srcset(this.image);
  }

  /** Beeld weg of transformatie geweigerd: liever de standaardafbeelding dan een fouticoon. */
  nietGeladen(): void {
    if (this.src === STANDAARD_AFBEELDING) return;
    this.src = STANDAARD_AFBEELDING;
    this.srcset = null;
  }
}
