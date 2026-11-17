import { Service, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { WishImage } from 'src/app/features/wishes/wish';
import { ApiClient } from 'src/app/core/api/api-client';

/** Default image of a wish without its own image; used to be wish_images/default on Cloudinary. */
export const DEFAULT_IMAGE = 'assets/default-wish.jpg';

/** Widths for the srcset; the browser picks one based on `sizes`. */
export const WIDTHS = [160, 320, 480, 640, 960];

/**
 * Wish images (sc-2911). They are stored in Cloudflare R2, via the backend (sc-3052):
 * the wish only keeps the key, and the backend cleans up old images itself.
 * Cloudinary has been gone since sc-3070.
 */
@Service()
export class ImagesData {
  private api = inject(ApiClient);


  /**
   * Uploads an image to R2 (POST /images, sc-3290): a resized photo as Blob
   * (the Blob's Content-Type is sent along) or an http(s) URL as string, which the backend fetches itself.
   * Returns {key, url}.
   */
  public uploadImage(image: Blob | string): Observable<WishImage> {
    if (!image) return of(null);
    // The contract types the raw bytes as string; HttpClient sends a Blob as it is.
    const body = typeof image === 'string' ? { sourceUrl: image } : image as unknown as string;
    return this.api.post('/images', { body });
  }

  /** Does the wish have an image of its own? */
  public hasImage(image: Partial<WishImage> | null | undefined): boolean {
    return !!(image?.key && image?.url);
  }

  /**
   * Can Image Transformations use this image as a source? An AVIF cannot (415, sc-3231):
   * we show that as the original, without other widths.
   */
  public transformable(image: Partial<WishImage> | null | undefined): boolean {
    return this.hasImage(image) && !/\.avif$/i.test(image.key);
  }

  /** URL of the image at the requested width, as webp/avif where the browser supports it. */
  public src(image: Partial<WishImage> | null | undefined, width: number): string {
    if (!this.hasImage(image)) return DEFAULT_IMAGE;
    if (!this.transformable(image)) return image.url;
    // Cloudflare Image Transformations on our own image domain (img.gimmi.be / img-test.gimmi.be).
    const base = image.url.slice(0, image.url.length - image.key.length);
    return `${base}cdn-cgi/image/width=${width},fit=scale-down,format=auto/${image.key}`;
  }

  /** srcset with all WIDTHS, or null for one fixed file (default image or AVIF). */
  public srcset(image: Partial<WishImage> | null | undefined): string {
    if (!this.transformable(image)) return null;
    return WIDTHS.map(w => `${this.src(image, w)} ${w}w`).join(', ');
  }
}
