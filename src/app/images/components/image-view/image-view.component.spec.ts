import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { STANDAARD_AFBEELDING } from '../../services/image.service';
import { ImageViewComponent } from './image-view.component';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

// Een gewone <img> met srcset (sc-2911), in plaats van <cl-image> van de Cloudinary-SDK.
describe('ImageViewComponent', () => {
    let component: ImageViewComponent;
    let fixture: ComponentFixture<ImageViewComponent>;
    const img = (): HTMLImageElement => fixture.nativeElement.querySelector('img');

    // OnPush: inputs via setInput (die markeert de view), daarna wachten tot de weergave bijgewerkt is.
    async function toon(image: any) {
        fixture.componentRef.setInput('image', image);
        await fixture.whenStable();
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
    imports: [ImageViewComponent],
    providers: [provideHttpClient(withXhr(), withInterceptorsFromDi()), provideHttpClientTesting()]
})
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ImageViewComponent);
        component = fixture.componentInstance;
        component.ngOnChanges();
        fixture.detectChanges();
    });

    it('zonder afbeelding: de standaardafbeelding, zonder srcset', () => {
        expect(img().getAttribute('src')).toBe(STANDAARD_AFBEELDING);
        expect(img().hasAttribute('srcset')).toBe(false);
        expect(img().hasAttribute('sizes')).toBe(false);
    });

    it('R2-beeld: transformatie-URL op het beelddomein, srcset en sizes, lazy', async () => {
        fixture.componentRef.setInput('sizes', '200px');
        await toon({ key: 'wishes/a.jpg', url: 'https://img-test.gimmi.be/wishes/a.jpg' });
        expect(img().getAttribute('src')).toBe('https://img-test.gimmi.be/cdn-cgi/image/width=640,fit=scale-down,format=auto/wishes/a.jpg');
        expect(img().getAttribute('srcset')).toContain('https://img-test.gimmi.be/cdn-cgi/image/width=160,fit=scale-down,format=auto/wishes/a.jpg 160w');
        expect(img().getAttribute('sizes')).toBe('200px');
        expect(img().getAttribute('loading')).toBe('lazy');
        expect(img().classList).toContain('beeld');
    });

    it('tijdens het laden een vlak in 3:2 (klasse laden), daarna de eigen hoogte; een ander beeld laadt opnieuw', async () => {
        await toon({ key: 'wishes/a.jpg', url: 'https://img-test.gimmi.be/wishes/a.jpg' });
        expect(img().classList).toContain('laden');
        img().dispatchEvent(new Event('load'));
        await fixture.whenStable();
        expect(img().classList).not.toContain('laden');
        expect(img().classList).toContain('beeld');
        expect(getComputedStyle(img()).aspectRatio).toBe('auto');

        await toon({ key: 'wishes/a.jpg', url: 'https://img-test.gimmi.be/wishes/a.jpg' });
        expect(img().classList).not.toContain('laden'); // zelfde beeld: blijft geladen
        await toon({ key: 'wishes/b.jpg', url: 'https://img-test.gimmi.be/wishes/b.jpg' });
        expect(img().classList).toContain('laden');
    });

    it('een oud Cloudinary-veld (zonder sleutel) telt als geen beeld (sc-3070)', async () => {
        await toon({ publicId: 'wish_images/w1', version: '3' } as any);
        expect(img().getAttribute('src')).toBe(STANDAARD_AFBEELDING);
        expect(img().hasAttribute('srcset')).toBe(false);
    });

    it('beeld laadt niet: de standaardafbeelding, en daarna niet nog eens', async () => {
        await toon({ key: 'wishes/a.jpg', url: 'https://img-test.gimmi.be/wishes/a.jpg' });
        img().dispatchEvent(new Event('error'));
        await fixture.whenStable();
        expect(img().getAttribute('src')).toBe(STANDAARD_AFBEELDING);
        expect(img().hasAttribute('srcset')).toBe(false);
        component.nietGeladen();
        expect(component.src).toBe(STANDAARD_AFBEELDING);
    });

    it('met voorvertoning (sc-3028): meteen die afbeelding, met dezelfde klassen', async () => {
        fixture.componentRef.setInput('class', 'img-fluid rounded');
        fixture.componentRef.setInput('preview', 'data:image/jpeg;base64,AAA');
        await fixture.whenStable();
        const voor: HTMLImageElement = fixture.nativeElement.querySelector('img.voorvertoning');
        expect(voor.getAttribute('src')).toBe('data:image/jpeg;base64,AAA');
        expect(voor.classList).toContain('img-fluid');
        expect(voor.classList).toContain('rounded');
        expect(fixture.nativeElement.querySelectorAll('img').length).toBe(1);
    });
});
