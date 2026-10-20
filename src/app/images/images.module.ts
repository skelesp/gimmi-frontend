import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbAlertModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';

import { ImagePickerComponent } from './components/image-picker/image-picker.component';
import { ImageUploadComponent } from './components/image-upload/image-upload.component';
import { ImageViewComponent } from './components/image-view/image-view.component';

@NgModule({
  declarations: [ImagePickerComponent, ImageUploadComponent, ImageViewComponent],
  imports: [
    CommonModule,
    FormsModule,
    NgbAlertModule,
    NgbNavModule
  ],
  exports: [
    ImageUploadComponent,
    ImageViewComponent
  ]
})
export class ImagesModule { }
