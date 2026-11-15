import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { DEFAULT_IMAGE } from '../../images-data';
import { ImageView } from './image-view';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

// A plain <img> with srcset (sc-2911), instead of <cl-image> from the Cloudinary SDK.
describe('ImageView', () => {
    let component: ImageView;
    let fixture: ComponentFixture<ImageView>;
    const img = (): HTMLImageElement => fixture.nativeElement.querySelector('img');

    // OnPush: inputs via setInput (which marks the view), then wait until the render is updated.
    async function show(image: unknown) {
        fixture.componentRef.setInput('image', image);
        await fixture.whenStable();
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
    imports: [ImageView],
    providers: [provideHttpClient(withXhr(), withInterceptorsFromDi()), provideHttpClientTesting()]
})
            .compileComponents();
    });

    beforeEach(async () => {
        fixture = TestBed.createComponent(ImageView);
        component = fixture.componentInstance;
        component.ngOnChanges();
        await fixture.whenStable();
    });

    it('without an image: the default image, without srcset', () => {
        expect(img().getAttribute('src')).toBe(DEFAULT_IMAGE);
        expect(img().hasAttribute('srcset')).toBe(false);
        expect(img().hasAttribute('sizes')).toBe(false);
    });

    it('R2 image: transformation URL on the image domain, srcset and sizes, lazy', async () => {
        fixture.componentRef.setInput('sizes', '200px');
        await show({ key: 'wishes/a.jpg', url: 'https://img-test.gimmi.be/wishes/a.jpg' });
        expect(img().getAttribute('src')).toBe('https://img-test.gimmi.be/cdn-cgi/image/width=640,fit=scale-down,format=auto/wishes/a.jpg');
        expect(img().getAttribute('srcset')).toContain('https://img-test.gimmi.be/cdn-cgi/image/width=160,fit=scale-down,format=auto/wishes/a.jpg 160w');
        expect(img().getAttribute('sizes')).toBe('200px');
        expect(img().getAttribute('loading')).toBe('lazy');
        expect(img().classList).toContain('image');
    });

    it('while loading a block at 3:2 (class loading), then its own height; another image loads again', async () => {
        await show({ key: 'wishes/a.jpg', url: 'https://img-test.gimmi.be/wishes/a.jpg' });
        expect(img().classList).toContain('loading');
        img().dispatchEvent(new Event('load'));
        await fixture.whenStable();
        expect(img().classList).not.toContain('loading');
        expect(img().classList).toContain('image');
        expect(getComputedStyle(img()).aspectRatio).toBe('auto');

        await show({ key: 'wishes/a.jpg', url: 'https://img-test.gimmi.be/wishes/a.jpg' });
        expect(img().classList).not.toContain('loading'); // same image: stays loaded
        await show({ key: 'wishes/b.jpg', url: 'https://img-test.gimmi.be/wishes/b.jpg' });
        expect(img().classList).toContain('loading');
    });

    it('an old Cloudinary field (without key) counts as no image (sc-3070)', async () => {
        await show({ publicId: 'wish_images/w1', version: '3' });
        expect(img().getAttribute('src')).toBe(DEFAULT_IMAGE);
        expect(img().hasAttribute('srcset')).toBe(false);
    });

    it('image does not load: the default image, and then not again', async () => {
        await show({ key: 'wishes/a.jpg', url: 'https://img-test.gimmi.be/wishes/a.jpg' });
        img().dispatchEvent(new Event('error'));
        await fixture.whenStable();
        expect(img().getAttribute('src')).toBe(DEFAULT_IMAGE);
        expect(img().hasAttribute('srcset')).toBe(false);
        component.notLoaded();
        expect(component.src).toBe(DEFAULT_IMAGE);
    });

    it('with a preview (sc-3028): that image right away, with the same classes', async () => {
        fixture.componentRef.setInput('class', 'img-fluid rounded');
        fixture.componentRef.setInput('preview', 'data:image/jpeg;base64,AAA');
        await fixture.whenStable();
        const previewImg: HTMLImageElement = fixture.nativeElement.querySelector('img.preview');
        expect(previewImg.getAttribute('src')).toBe('data:image/jpeg;base64,AAA');
        expect(previewImg.classList).toContain('img-fluid');
        expect(previewImg.classList).toContain('rounded');
        expect(fixture.nativeElement.querySelectorAll('img').length).toBe(1);
    });
});
