import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { STANDAARD_AFBEELDING } from '../../services/image.service';
import { ImageViewComponent } from './image-view.component';

// Een gewone <img> met srcset (sc-2911), in plaats van <cl-image> van de Cloudinary-SDK.
describe('ImageViewComponent', () => {
  let component: ImageViewComponent;
  let fixture: ComponentFixture<ImageViewComponent>;
  const img = (): HTMLImageElement => fixture.nativeElement.querySelector('img');

  function toon(image: any) {
    component.image = image;
    component.ngOnChanges();
    fixture.detectChanges();
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ ImageViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageViewComponent);
    component = fixture.componentInstance;
    component.ngOnChanges();
    fixture.detectChanges();
  });

  it('zonder afbeelding: de standaardafbeelding, zonder srcset', () => {
    expect(img().getAttribute('src')).toBe(STANDAARD_AFBEELDING);
    expect(img().hasAttribute('srcset')).toBeFalse();
    expect(img().hasAttribute('sizes')).toBeFalse();
  });

  it('R2-beeld: transformatie-URL op het beelddomein, srcset en sizes, lazy', () => {
    component.sizes = '200px';
    toon({ key: 'wishes/a.jpg', url: 'https://img-test.gimmi.be/wishes/a.jpg' });
    expect(img().getAttribute('src')).toBe('https://img-test.gimmi.be/cdn-cgi/image/width=640,fit=scale-down,format=auto/wishes/a.jpg');
    expect(img().getAttribute('srcset')).toContain('https://img-test.gimmi.be/cdn-cgi/image/width=160,fit=scale-down,format=auto/wishes/a.jpg 160w');
    expect(img().getAttribute('sizes')).toBe('200px');
    expect(img().getAttribute('loading')).toBe('lazy');
    expect(img().classList).toContain('beeld');
  });

  it('tijdens het laden een vlak in 3:2 (klasse laden), daarna de eigen hoogte; een ander beeld laadt opnieuw', () => {
    toon({ key: 'wishes/a.jpg', url: 'https://img-test.gimmi.be/wishes/a.jpg' });
    expect(img().classList).toContain('laden');
    img().dispatchEvent(new Event('load'));
    fixture.detectChanges();
    expect(img().classList).not.toContain('laden');
    expect(img().classList).toContain('beeld');
    expect(getComputedStyle(img()).aspectRatio).toBe('auto');

    toon({ key: 'wishes/a.jpg', url: 'https://img-test.gimmi.be/wishes/a.jpg' });
    expect(img().classList).not.toContain('laden');   // zelfde beeld: blijft geladen
    toon({ key: 'wishes/b.jpg', url: 'https://img-test.gimmi.be/wishes/b.jpg' });
    expect(img().classList).toContain('laden');
  });

  it('nog niet gemigreerd Cloudinary-beeld: rechtstreeks van Cloudinary', () => {
    toon({ publicId: 'wish_images/w1', version: '3' });
    expect(img().getAttribute('src')).toMatch(/^https:\/\/res\.cloudinary\.com\/\w+\/image\/upload\/f_auto,c_limit,w_640\/v3\/wish_images\/w1$/);
  });

  it('beeld laadt niet: de standaardafbeelding, en daarna niet nog eens', () => {
    toon({ key: 'wishes/a.jpg', url: 'https://img-test.gimmi.be/wishes/a.jpg' });
    img().dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(img().getAttribute('src')).toBe(STANDAARD_AFBEELDING);
    expect(img().hasAttribute('srcset')).toBeFalse();
    component.nietGeladen();
    expect(component.src).toBe(STANDAARD_AFBEELDING);
  });

  it('met voorvertoning (sc-3028): meteen die afbeelding, met dezelfde klassen', () => {
    component.class = 'img-fluid rounded';
    component.preview = 'data:image/jpeg;base64,AAA';
    fixture.detectChanges();
    const voor: HTMLImageElement = fixture.nativeElement.querySelector('img.voorvertoning');
    expect(voor.getAttribute('src')).toBe('data:image/jpeg;base64,AAA');
    expect(voor.classList).toContain('img-fluid');
    expect(voor.classList).toContain('rounded');
    expect(fixture.nativeElement.querySelectorAll('img').length).toBe(1);
  });
});
