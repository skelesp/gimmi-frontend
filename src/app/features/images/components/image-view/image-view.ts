import { Component, Input, OnChanges, ChangeDetectionStrategy, inject } from '@angular/core';
import { WishImage } from 'src/app/features/wishes/wish';
import { ImagesData, DEFAULT_IMAGE } from '../../images-data';


/**
 * Shows the image of a wish (sc-2911): a plain <img> with srcset, so the browser
 * fetches a suitable width (Cloudflare Image Transformations on the image domain of R2).
 * The image keeps its own height (the grid of wish cards is deliberately
 * staggered); only while loading is there a light grey block at 3:2 (was sc-2632). If the image
 * does not load, the default image is shown.
 */
@Component({
    selector: 'gimmi-image-view',
    templateUrl: './image-view.html',
    styleUrls: ['./image-view.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: []
})
export class ImageView implements OnChanges {
  private imageService = inject(ImagesData);

  @Input() image : Partial<WishImage> | null = null;
  @Input() class  = "";
  /** How wide the image is shown, for the choice from the srcset. */
  @Input() sizes  = "(max-width: 574px) 50vw, (max-width: 766px) 33vw, 25vw";
  /**
   * Show this URL or data URI instead of the stored image (sc-3028): right after
   * choosing, the browser already has the new image.
   */
  @Input() preview : string = null;

  src: string = DEFAULT_IMAGE;
  srcset: string = null;
  /** Only true once the image is shown; until then `.loading` keeps the place free. */
  loaded = false;

  ngOnChanges(): void {
    const src = this.imageService.src(this.image, 640);
    if (src !== this.src) this.loaded = false;
    this.src = src;
    this.srcset = this.imageService.srcset(this.image);
  }

  /** Image gone or transformation refused: better the default image than a broken-image icon. */
  notLoaded(): void {
    if (this.src === DEFAULT_IMAGE) return;
    this.src = DEFAULT_IMAGE;
    this.srcset = null;
  }
}
