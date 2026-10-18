import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IWishImage } from 'src/app/wishes/models/wish.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  constructor( private http$ : HttpClient ) { }

  /**
   * Upload a cloudinary image
   * @function uploadImage
   * @param {String} publicId The wanted publicId of the image (best practice: equal to wish ID)
   * @param {String} image An http(s) url or an image data URI (sc-3028); the backend fetches/uploads it
   * @return {Image} Return an image if the upload succeeded
   * @return {Error} Return an image if the upload failed
   */
  public uploadImage (imageUrl: string, publicId: string) : Observable<IWishImage>{
    return imageUrl ? this.http$.post<{ public_id: string, version: string }>(
      environment.apiUrl + 'images',
      {public_id: publicId, image: imageUrl}
    ).pipe(
      map(newImage => ({ publicId: newImage.public_id, version: newImage.version}) )
    ) : of(null);
  }

  /**
   * Rename a cloudinary imagee
   * @function renameImage
   * @param {String} publicId The current publicId of the image
   * @param {String} newName The new name of the image. No foldername included in this id!! Only new image ID.
   * @return {Image}
   */
  public renameImage (publicId : string, newName : string) : Observable<IWishImage> {
    return this.http$.put<any>(
      environment.apiUrl + 'images/' + encodeURIComponent(publicId) + '/public_id',
      { new_public_id: newName }
    ).pipe(
      map(renamedImage => ({publicId: renamedImage.public_id, version: renamedImage.version}))
    )
  }

  /**
   * Delete a cloudinary image
   * @function deleteImage
   * @param {String} publicId The current publicId of the image
   */
  public deleteImage ( image : IWishImage) : Observable<boolean>{
    if (!image?.publicId || image?.publicId === environment.cloudinary.defaultImage.publicId) return of(false);

    return this.http$.delete<any>(
      environment.apiUrl + 'images/' + encodeURIComponent(image.publicId)
    ).pipe(
      map( result => result.delete === "ok"),
      catchError((error: HttpErrorResponse) => {
        console.error('[cloudinaryService] PublicID not found', error);
        return of(false);
      })
    );
  }

  /**
   * Generate a random public id
   * @param {String} prefix A string to attach before the random number
   * @param {String} postfix A string to attach after the random number
   */
  public generateRandomPublicId (prefix, postfix) {
    var randomNumber : number = Math.floor((Math.random() * 1000000) + 1);
    return `${prefix}-${randomNumber}${postfix}`
  }

  /** 
   * Generate a cloudinary URL based on public_id
   * @param {String} public_id
   * @param {String} version
   */
 public generateCloudinaryUrl ( image: IWishImage ) : string {
    return image ? "https://res.cloudinary.com/" + environment.cloudinary.cloud_name + "/image/upload/v" + image.version + "/" + image.publicId : null;
  }

  public isTemporaryImage (image : IWishImage) {
    return image?.publicId.slice(-environment.cloudinary.temporaryImagePostfix.length) === environment.cloudinary.temporaryImagePostfix;
  }

}
