import { Service, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IWishImage } from 'src/app/features/wishes/models/wish.model';
import { ApiClient } from 'src/app/core/api/api-client';

/** Standaardafbeelding van een wens zonder eigen beeld; vroeger wish_images/default op Cloudinary. */
export const STANDAARD_AFBEELDING = 'assets/standaard-wens.jpg';

/** Breedtes voor de srcset; de browser kiest er zelf één op basis van `sizes`. */
export const BREEDTES = [160, 320, 480, 640, 960];

/**
 * Afbeeldingen van wensen (sc-2911). Opslaan gebeurt in Cloudflare R2, via de backend
 * (sc-3052): de wens bewaart enkel de sleutel, de backend ruimt oude beelden zelf op.
 * Cloudinary is weg sinds sc-3070.
 */
@Service()
export class ImagesData {
  private api = inject(ApiClient);


  /**
   * Laadt een afbeelding op naar R2 (POST /images, sc-3290): een verkleinde foto als Blob
   * (het Content-Type van de Blob gaat mee) of een http(s)-URL als string, die de backend zelf ophaalt.
   * Geeft {key, url} terug.
   */
  public uploadImage(image: Blob | string): Observable<IWishImage> {
    if (!image) return of(null);
    // Het contract typeert de ruwe bytes als string; HttpClient stuurt een Blob zoals hij is.
    const body = typeof image === 'string' ? { sourceUrl: image } : image as unknown as string;
    return this.api.post('/images', { body });
  }

  /** Heeft de wens een eigen beeld? */
  public heeftBeeld(image: IWishImage): boolean {
    return !!(image?.key && image?.url);
  }

  /**
   * Kan Image Transformations dit beeld als bron gebruiken? Een AVIF niet (415, sc-3231):
   * dat tonen we als origineel, zonder andere breedtes.
   */
  public transformeerbaar(image: IWishImage): boolean {
    return this.heeftBeeld(image) && !/\.avif$/i.test(image.key);
  }

  /** URL van het beeld in de gevraagde breedte, als webp/avif waar de browser dat kan. */
  public src(image: IWishImage, breedte: number): string {
    if (!this.heeftBeeld(image)) return STANDAARD_AFBEELDING;
    if (!this.transformeerbaar(image)) return image.url;
    // Cloudflare Image Transformations op het eigen beelddomein (img.gimmi.be / img-test.gimmi.be).
    const basis = image.url.slice(0, image.url.length - image.key.length);
    return `${basis}cdn-cgi/image/width=${breedte},fit=scale-down,format=auto/${image.key}`;
  }

  /** srcset met alle BREEDTES, of null voor één vast bestand (standaardafbeelding of AVIF). */
  public srcset(image: IWishImage): string {
    if (!this.transformeerbaar(image)) return null;
    return BREEDTES.map(b => `${this.src(image, b)} ${b}w`).join(', ');
  }
}
