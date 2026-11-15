import type { Mock } from 'vitest';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal, NgbAlertModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { DeviceDetectorService } from 'ngx-device-detector';
import { of, Subject, throwError } from 'rxjs';

import { ApiProblem, ProblemCode } from 'src/app/core/api/api-problem';
import { WishImage } from 'src/app/features/wishes/wish';
import { ImagesData } from '../../images-data';
import { IImageSearchResult, ImageSearch } from '../../image-search';
import { messageFor, ImagePicker, MAX_FILE_BYTES } from './image-picker';

// The own image picker as a popup (sc-3028): searching via Brave, uploading a photo/file via
// the backend to R2 (sc-2911). Replaces the Cloudinary widget; network, device and popup are mocked.
describe('ImagePicker', () => {
    let fixture: ComponentFixture<ImagePicker>;
    let component: ImagePicker;
    let images: Record<string, Mock>;
    let searchService: Record<string, Mock>;
    let device: Record<string, Mock>;
    let modal: Record<string, Mock>;

    const result = (n: number): IImageSearchResult => ({
        url: `https://shop.be/${n}.jpg`, thumbnailUrl: `https://imgs.search.brave.com/${n}`,
        width: 100, height: 100, title: `Bike ${n}`, source: 'shop.be', pageUrl: null
    });
    const error = (status: number, code: ProblemCode) => new ApiProblem({ status, code, title: 'x' });

    async function create(options: {
        query?: string;
    } = {}) {
        fixture = TestBed.createComponent(ImagePicker);
        component = fixture.componentInstance;
        if (options.query !== undefined)
            component.searchTerm = options.query;
        await fixture.whenStable();
    }
    const el = (css: string): HTMLElement => fixture.nativeElement.querySelector(css);
    const all = (css: string): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll(css));
    const text = () => fixture.nativeElement.textContent as string;
    async function click(buttonText: string) {
        const button = all('button, a').find(b => b.textContent.trim() === buttonText);
        expect(button, `button "${buttonText}"`).toBeTruthy();
        button.click();
        await fixture.whenStable();
    }

    beforeEach(async () => {
        images = {
            uploadImage: vi.fn().mockName("ImagesData.uploadImage")
        };
        searchService = {
            search: vi.fn().mockName("ImageSearch.search")
        };
        searchService.search.mockReturnValue(of([result(1), result(2)]));
        device = {
            isMobile: vi.fn().mockName("DeviceDetectorService.isMobile"),
            isTablet: vi.fn().mockName("DeviceDetectorService.isTablet")
        };
        device.isMobile.mockReturnValue(false);
        device.isTablet.mockReturnValue(false);
        modal = {
            close: vi.fn().mockName("NgbActiveModal.close"),
            dismiss: vi.fn().mockName("NgbActiveModal.dismiss")
        };
        await TestBed.configureTestingModule({
    imports: [NgbNavModule, NgbAlertModule, ImagePicker],
    providers: [
        { provide: ImagesData, useValue: images },
        { provide: ImageSearch, useValue: searchService },
        { provide: DeviceDetectorService, useValue: device },
        { provide: NgbActiveModal, useValue: modal }
    ]
}).compileComponents();
    });

    describe('popup', () => {
        it('title "Kies een afbeelding", starts on the Zoeken tab', async () => {
            await create();
            expect(el('.modal-title').textContent.trim()).toBe('Kies een afbeelding');
            expect(el('#picker-title')).not.toBeNull();
            expect(el('.nav-link.active').textContent.trim()).toBe('Zoeken');
        });

        it('Annuleer and the cross close the popup without a result', async () => {
            await create();
            await click('Annuleer');
            (el('.modal-header .btn-close')).click();
            expect(modal.dismiss).toHaveBeenCalledTimes(2);
            expect(modal.close).not.toHaveBeenCalled();
        });
    });

    describe('searching', () => {
        it('searches right away on the title of the wish (sc-1330) and shows the results', async () => {
            await create({ query: '  Rode fiets ' });
            expect(searchService.search).toHaveBeenCalledTimes(1);
            expect(searchService.search).toHaveBeenCalledWith('Rode fiets');
            await fixture.whenStable(); // the field writes asynchronously
            expect((el('input[type=search]') as HTMLInputElement).value).toBe('Rode fiets');
            const images = all('.result img') as HTMLImageElement[];
            expect(images.map(i => i.src)).toEqual(['https://imgs.search.brave.com/1', 'https://imgs.search.brave.com/2']);
            expect(images[0].alt).toBe('Bike 1');
            expect(text()).toContain('Zoekresultaten van Brave Search');
        });

        it('a thumbnail that does not load disappears from the grid', async () => {
            await create({ query: 'fiets' });
            all('.result img')[0].dispatchEvent(new Event('error'));
            await fixture.whenStable();
            expect((all('.result img') as HTMLImageElement[]).map(i => i.alt)).toEqual(['Bike 2']);
        });

        it('without a title: do not search, but show a hint', async () => {
            await create({ query: '' });
            expect(searchService.search).not.toHaveBeenCalled();
            expect(text()).toContain('Geef een zoekterm in');
        });

        it('an own query with Enter: searches and prevents the default action', async () => {
            await create();
            await fixture.whenStable();
            const field = el('input[type=search]') as HTMLInputElement;
            field.value = 'blue scooter';
            field.dispatchEvent(new Event('input'));
            const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
            field.dispatchEvent(enter);
            await fixture.whenStable();
            expect(enter.defaultPrevented).toBe(true);
            expect(searchService.search).toHaveBeenCalledWith('blue scooter');
        });

        it('the Zoek button searches; an empty query does nothing', async () => {
            await create();
            await click('Zoek');
            expect(searchService.search).not.toHaveBeenCalled();
            component.query = 'ball';
            await click('Zoek');
            expect(searchService.search).toHaveBeenCalledWith('ball');
        });

        it('a query of more than 200 characters does not search', async () => {
            await create();
            component.query = 'x'.repeat(201);
            await click('Zoek');
            expect(searchService.search).not.toHaveBeenCalled();
        });

        it('while searching: spinner and the button is disabled', async () => {
            const pending = new Subject<IImageSearchResult[]>();
            searchService.search.mockReturnValue(pending);
            await create({ query: 'fiets' });
            expect(el('.spinner-border')).not.toBeNull();
            expect((all('button').find(b => b.textContent.trim() === 'Zoek') as HTMLButtonElement).disabled).toBe(true);
            pending.next([]);
            await fixture.whenStable();
            expect(text()).toContain('Geen afbeeldingen gevonden');
        });

        it('searching fails: the message for the error code of the backend', async () => {
            searchService.search.mockReturnValue(throwError(error(503, 'image-search-unavailable')));
            await create({ query: 'fiets' });
            expect(el('ngb-alert').textContent).toContain('Afbeeldingen zoeken lukt nu niet. Probeer het straks opnieuw.');
            expect(all('.result').length).toBe(0);
        });

        it('a new search aborts the previous one', async () => {
            const first = new Subject<IImageSearchResult[]>();
            searchService.search.mockReturnValueOnce(first).mockReturnValueOnce(of([result(9)]));
            await create({ query: 'fiets' });
            component.query = 'scooter';
            component.search();
            await fixture.whenStable();
            expect(first.observers.length).toBe(0);
            expect(all('.result').length).toBe(1);
        });
    });

    describe('choosing a search result', () => {
        it('uploads the URL and closes with the image and the thumbnail as preview', async () => {
            const created: WishImage = { key: 'wishes/a.jpg', url: 'https://img-test.gimmi.be/wishes/a.jpg' };
            images.uploadImage.mockReturnValue(of(created));
            await create({ query: 'fiets' });
            all('.result')[1].click();
            expect(images.uploadImage).toHaveBeenCalledWith('https://shop.be/2.jpg');
            expect(modal.close).toHaveBeenCalledWith({ image: created, preview: 'https://imgs.search.brave.com/2' });
        });

        it('while uploading: spinner on the chosen result, the others are disabled', async () => {
            images.uploadImage.mockReturnValue(new Subject<WishImage>());
            await create({ query: 'fiets' });
            all('.result')[0].click();
            await fixture.whenStable();
            const [first, second] = all('.result') as HTMLButtonElement[];
            expect(first.classList).toContain('busy');
            expect(first.querySelector('.spinner-border')).not.toBeNull();
            expect(second.disabled).toBe(true);
            component.choose(result(2));
            expect(images.uploadImage).toHaveBeenCalledTimes(1);
        });

        it('the source site refuses (sc-2960): notice, result greyed out, choosing another is possible', async () => {
            images.uploadImage.mockReturnValueOnce(throwError(error(422, 'image-source-refused'))).mockReturnValueOnce(of({ key: 'wishes/p.jpg', url: 'u' }));
            await create({ query: 'fiets' });
            all('.result')[0].click();
            await fixture.whenStable();
            expect(el('ngb-alert').textContent).toContain('De website weigert de afbeelding te delen.');
            const [first, second] = all('.result') as HTMLButtonElement[];
            expect(first.classList).toContain('failed');
            expect(first.disabled).toBe(true);
            expect(modal.close).not.toHaveBeenCalled();

            second.click();
            expect(modal.close).toHaveBeenCalledWith({ image: { key: 'wishes/p.jpg', url: 'u' }, preview: 'https://imgs.search.brave.com/2' });
        });

        it('choosing a failed result again does nothing', async () => {
            images.uploadImage.mockReturnValue(throwError(error(422, 'image-gone')));
            await create({ query: 'fiets' });
            component.choose(result(1));
            component.choose(result(1));
            expect(images.uploadImage).toHaveBeenCalledTimes(1);
        });

        it('popup gone during searching and uploading: everything is aborted (sc-1391)', async () => {
            const searchSubject = new Subject<IImageSearchResult[]>();
            const upload = new Subject<WishImage>();
            searchService.search.mockReturnValue(searchSubject);
            images.uploadImage.mockReturnValue(upload);
            await create({ query: 'fiets' });
            component.choose(result(1));
            fixture.destroy();
            expect(searchSubject.observers.length).toBe(0);
            expect(upload.observers.length).toBe(0);
        });
    });

    describe('photo / file', () => {
        function pngFile(name = 'photo.png'): Promise<File> {
            const canvas = document.createElement('canvas');
            canvas.width = 40;
            canvas.height = 20;
            canvas.getContext('2d').fillRect(0, 0, 40, 20);
            return new Promise(resolve => canvas.toBlob(b => resolve(new File([b], name, { type: 'image/png' })), 'image/png'));
        }
        function chooseFile(file: File): Promise<void> {
            const input = el('input[data-testid=choose-file]') as HTMLInputElement;
            const list = new DataTransfer();
            list.items.add(file);
            input.files = list.files;
            return component.fileChosen({ target: input } as unknown as Event);
        }
        async function openFileTab() {
            await create();
            await click('Foto / bestand');
        }

        it('on desktop only "Bestand kiezen" (red main button), without capture', async () => {
            await openFileTab();
            const labels = all('label');
            expect(labels.map(l => l.textContent.trim())).toEqual(['Bestand kiezen']);
            expect(labels[0].classList).toContain('btn-danger');
            expect(el('input[type=file]').hasAttribute('capture')).toBe(false);
            expect(el('input[type=file]').getAttribute('accept')).toBe('image/*');
        });

        it('on phone or tablet first "Foto nemen" with the camera, then the file button', async () => {
            device.isTablet.mockReturnValue(true);
            await openFileTab();
            const labels = all('label');
            expect(labels.map(l => l.textContent.trim())).toEqual(['Foto nemen', 'Bestand kiezen']);
            expect(labels[1].classList).toContain('btn-outline-danger');
            expect(el('input[capture]').getAttribute('capture')).toBe('environment');
        });

        it('resizes the file, uploads the JPEG as Blob and closes with the image and a blob URL as preview', async () => {
            images.uploadImage.mockReturnValue(of({ key: 'wishes/f.jpg', url: 'u' }));
            await openFileTab();
            await chooseFile(await pngFile());
            const [image] = vi.mocked(images.uploadImage).mock.lastCall;
            expect(image).toBeInstanceOf(Blob);
            expect(image.type).toBe('image/jpeg');
            expect(modal.close).toHaveBeenCalledWith({ image: { key: 'wishes/f.jpg', url: 'u' }, preview: expect.stringMatching(/^blob:/) });
        });

        it('while uploading: "Bezig met opladen…"', async () => {
            images.uploadImage.mockReturnValue(new Subject<WishImage>());
            await openFileTab();
            await chooseFile(await pngFile());
            await fixture.whenStable();
            expect(text()).toContain('Bezig met opladen…');
        });

        it('uploading fails: notice, popup stays open', async () => {
            images.uploadImage.mockReturnValue(throwError(error(413, 'payload-too-large')));
            await openFileTab();
            await chooseFile(await pngFile());
            await fixture.whenStable();
            expect(el('ngb-alert').textContent).toContain('Het bestand of de gegevens zijn te groot.');
            expect(component.busyWith()).toBeNull();
            expect(modal.close).not.toHaveBeenCalled();
        });

        it('not an image (e.g. a pdf): notice, nothing uploaded', async () => {
            await openFileTab();
            await chooseFile(new File(['%PDF'], 'x.pdf', { type: 'application/pdf' }));
            await fixture.whenStable();
            expect(el('ngb-alert').textContent).toContain('Dit bestand is geen bruikbare afbeelding.');
            expect(images.uploadImage).not.toHaveBeenCalled();
        });

        it('larger than 30 MB: notice, nothing uploaded', async () => {
            await openFileTab();
            const big = new File([new Uint8Array(1)], 'big.jpg', { type: 'image/jpeg' });
            Object.defineProperty(big, 'size', { value: MAX_FILE_BYTES + 1 });
            await chooseFile(big);
            expect(component.uploadError()).toContain('te groot');
            expect(images.uploadImage).not.toHaveBeenCalled();
        });

        it('unreadable image: notice, nothing uploaded', async () => {
            await openFileTab();
            await chooseFile(new File(['broken'], 'broken.jpg', { type: 'image/jpeg' }));
            expect(component.uploadError()).toContain('kunnen we niet lezen');
            expect(component.busyWith()).toBeNull();
            expect(images.uploadImage).not.toHaveBeenCalled();
        });

        it('no file chosen (dialog cancelled): nothing', async () => {
            await openFileTab();
            const input = el('input[data-testid=choose-file]') as HTMLInputElement;
            await component.fileChosen({ target: input } as unknown as Event);
            expect(component.uploadError()).toBeNull();
            expect(images.uploadImage).not.toHaveBeenCalled();
        });

        it('popup closed while resizing: nothing is uploaded any more', async () => {
            await openFileTab();
            const busy = chooseFile(await pngFile());
            fixture.destroy();
            await busy;
            expect(images.uploadImage).not.toHaveBeenCalled();
        });

        it('switching tab clears an old error message', async () => {
            await openFileTab();
            await chooseFile(new File(['%PDF'], 'x.pdf', { type: 'application/pdf' }));
            await fixture.whenStable();
            await click('Zoeken');
            expect(el('ngb-alert')).toBeNull();
        });
    });

    describe('messageFor', () => {
        it('an API v2 error code: the Dutch text for that code', () => {
            expect(messageFor(error(422, 'image-unreachable'))).toBe('De website met de afbeelding antwoordt niet.');
            expect(messageFor(error(429, 'rate-limited'))).toBe('Je doet dit te vaak. Wacht even en probeer opnieuw.');
            expect(messageFor(error(415, 'not-an-image'))).toBe('Dit is geen afbeelding van een ondersteund type.');
        });
        it('an unknown code: the generic text for the status', () => {
            expect(messageFor(error(422, 'something-new' as ProblemCode))).toBe('Dit kan niet met de gegevens die je opgaf.');
        });
        it('a network error or other object: generic message', () => {
            expect(messageFor(new Error('offline'))).toBe('Er ging iets mis. Probeer het opnieuw.');
            expect(messageFor(null)).toBe('Er ging iets mis. Probeer het opnieuw.');
        });
    });
});
