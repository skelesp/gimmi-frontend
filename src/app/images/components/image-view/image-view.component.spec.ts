import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { environment } from 'src/environments/environment';
import { ImageViewComponent } from './image-view.component';

describe('ImageViewComponent', () => {
  let component: ImageViewComponent;
  let fixture: ComponentFixture<ImageViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ImageViewComponent ],
      schemas: [NO_ERRORS_SCHEMA]   // cl-image zelf (Cloudinary-SDK) niet laden
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('zonder voorvertoning: de Cloudinary-afbeelding', () => {
    component.image = { publicId: 'wish_images/w1', version: '3' };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('cl-image')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('img.voorvertoning')).toBeNull();
  });

  it('zonder afbeelding: de standaardafbeelding', () => {
    component.image = null;
    component.ngOnChanges();
    expect(component.image).toEqual(environment.cloudinary.defaultImage);
  });

  it('met voorvertoning (sc-3028): meteen die afbeelding, met dezelfde klassen, zonder cl-image', () => {
    component.class = 'img-fluid rounded';
    component.preview = 'data:image/jpeg;base64,AAA';
    fixture.detectChanges();
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img.voorvertoning');
    expect(img.getAttribute('src')).toBe('data:image/jpeg;base64,AAA');
    expect(img.classList).toContain('img-fluid');
    expect(img.classList).toContain('rounded');
    expect(fixture.nativeElement.querySelector('cl-image')).toBeNull();
  });
});
