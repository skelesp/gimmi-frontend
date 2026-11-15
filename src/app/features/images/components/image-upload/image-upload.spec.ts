import type { Mock } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { ImagePicker } from '../image-picker/image-picker';
import { ImageUpload } from './image-upload';

// The "Kies afbeelding" button opens the image picker as a popup (sc-3028).
describe('ImageUpload', () => {
    beforeEach(() => {
        vi.useFakeTimers({ advanceTimeDelta: 1, shouldAdvanceTime: true });
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    let fixture: ComponentFixture<ImageUpload>;
    let component: ImageUpload;
    let modalService: Record<string, Mock>;
    let picker: {
        componentInstance: Record<string, unknown>;
        result: Promise<unknown>;
        dismiss: Mock;
    };
    let close: (value: unknown) => void;
    let cancel: (reason: unknown) => void;
    let uploaded: Mock;

    async function create(options: {
        searchTerm?: string;
    } = {}) {
        fixture = TestBed.createComponent(ImageUpload);
        component = fixture.componentInstance;
        if (options.searchTerm)
            component.searchTerm = options.searchTerm;
        uploaded = vi.fn().mockName('imageUploaded');
        component.imageUploaded.subscribe(uploaded);
        await fixture.whenStable();
    }
    function clickButton() {
        const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
        expect(button.textContent).toContain('Kies afbeelding');
        button.click();
    }

    beforeEach(async () => {
        modalService = {
            open: vi.fn().mockName("NgbModal.open")
        };
        modalService.open.mockImplementation(() => {
            picker = {
                componentInstance: {},
                result: new Promise((ok, nok) => { close = ok; cancel = nok; }),
                dismiss: vi.fn().mockName('dismiss')
            };
            return picker as unknown as NgbModalRef;
        });
        await TestBed.configureTestingModule({
    imports: [ImageUpload],
    providers: [
        { provide: NgbModal, useValue: modalService }
    ]
}).compileComponents();
    });

    it('opens the picker as a large popup with the title as search term', async () => {
        await create({ searchTerm: 'Rode fiets' });
        clickButton();
        expect(modalService.open).toHaveBeenCalledWith(ImagePicker, { size: 'lg', scrollable: true, ariaLabelledBy: 'picker-title' });
        expect(picker.componentInstance.searchTerm).toBe('Rode fiets');
    });

    it('the title at the moment of opening counts, not the one at creation', async () => {
        await create({ searchTerm: 'fiets' });
        component.searchTerm = 'step';
        clickButton();
        expect(picker.componentInstance.searchTerm).toBe('step');
    });

    it('picker closes with an image: first the preview, then the image', async () => {
        await create();
        const order: string[] = [];
        component.previewChanged.subscribe(v => order.push('preview ' + v));
        component.imageUploaded.subscribe(a => order.push('image ' + a.key));
        clickButton();
        close({ image: { key: 'wishes/a.jpg', url: 'u' }, preview: 'data:image/jpeg;base64,AAA' });
        await vi.advanceTimersByTimeAsync(0);
        expect(uploaded).toHaveBeenCalledWith({ key: 'wishes/a.jpg', url: 'u' });
        expect(order).toEqual(['preview data:image/jpeg;base64,AAA', 'image wishes/a.jpg']);
    });

    it('picker cancelled: nothing passed on, and nothing left to close when the wish popup closes', async () => {
        await create();
        clickButton();
        cancel('Cancel');
        await vi.advanceTimersByTimeAsync(0);
        expect(uploaded).not.toHaveBeenCalled();
        fixture.destroy();
        expect(picker.dismiss).not.toHaveBeenCalled();
    });

    it('the wish popup closes while the picker is open: the picker closes too (sc-1391)', async () => {
        await create();
        clickButton();
        fixture.destroy();
        expect(picker.dismiss).toHaveBeenCalledWith('Wish popup closed');
    });

    it('without an open picker: closing the wish popup just works', async () => {
        await create();
        expect(() => fixture.destroy()).not.toThrow();
    });
});
