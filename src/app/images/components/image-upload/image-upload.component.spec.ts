import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { ImagePickerComponent } from '../image-picker/image-picker.component';
import { ImageUploadComponent } from './image-upload.component';

// De knop "Kies afbeelding" opent de afbeeldingskiezer als popup (sc-3028).
describe('ImageUploadComponent', () => {
  let fixture: ComponentFixture<ImageUploadComponent>;
  let component: ImageUploadComponent;
  let modalService: jasmine.SpyObj<NgbModal>;
  let kiezer: { componentInstance: any, result: Promise<any>, dismiss: jasmine.Spy };
  let sluit: (waarde: any) => void;
  let annuleer: (reden: any) => void;
  let opgeladen: jasmine.Spy;

  function maak(opties: { zoekterm?: string } = {}) {
    fixture = TestBed.createComponent(ImageUploadComponent);
    component = fixture.componentInstance;
    if (opties.zoekterm) component.searchTerm = opties.zoekterm;
    opgeladen = jasmine.createSpy('imageUploaded');
    component.imageUploaded.subscribe(opgeladen);
    fixture.detectChanges();
  }
  function klikKnop() {
    const knop: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(knop.textContent).toContain('Kies afbeelding');
    knop.click();
  }

  beforeEach(async () => {
    modalService = jasmine.createSpyObj<NgbModal>('NgbModal', ['open']);
    modalService.open.and.callFake(() => {
      kiezer = {
        componentInstance: {},
        result: new Promise((ok, nok) => { sluit = ok; annuleer = nok; }),
        dismiss: jasmine.createSpy('dismiss')
      };
      return kiezer as unknown as NgbModalRef;
    });
    await TestBed.configureTestingModule({
      declarations: [ImageUploadComponent],
      providers: [
        { provide: NgbModal, useValue: modalService }
      ]
    }).compileComponents();
  });

  it('opent de kiezer als grote popup met de titel als zoekterm', () => {
    maak({ zoekterm: 'Rode fiets' });
    klikKnop();
    expect(modalService.open).toHaveBeenCalledWith(ImagePickerComponent, { size: 'lg', scrollable: true, ariaLabelledBy: 'kiezer-titel' });
    expect(kiezer.componentInstance.searchTerm).toBe('Rode fiets');
  });

  it('de titel op het moment van openen telt, niet die bij het aanmaken', () => {
    maak({ zoekterm: 'fiets' });
    component.searchTerm = 'step';
    klikKnop();
    expect(kiezer.componentInstance.searchTerm).toBe('step');
  });

  it('kiezer sluit met een afbeelding: eerst de voorvertoning, dan de afbeelding', fakeAsync(() => {
    maak();
    const volgorde: string[] = [];
    component.previewChanged.subscribe(v => volgorde.push('voorvertoning ' + v));
    component.imageUploaded.subscribe(a => volgorde.push('afbeelding ' + a.key));
    klikKnop();
    sluit({ afbeelding: { key: 'wishes/a.jpg', url: 'u' }, voorvertoning: 'data:image/jpeg;base64,AAA' });
    tick();
    expect(opgeladen).toHaveBeenCalledWith({ key: 'wishes/a.jpg', url: 'u' });
    expect(volgorde).toEqual(['voorvertoning data:image/jpeg;base64,AAA', 'afbeelding wishes/a.jpg']);
  }));

  it('kiezer geannuleerd: niets doorgegeven, en bij het sluiten van de wens-popup niets meer te sluiten', fakeAsync(() => {
    maak();
    klikKnop();
    annuleer('Cancel');
    tick();
    expect(opgeladen).not.toHaveBeenCalled();
    fixture.destroy();
    expect(kiezer.dismiss).not.toHaveBeenCalled();
  }));

  it('de wens-popup sluit terwijl de kiezer open is: de kiezer sluit mee (sc-1391)', () => {
    maak();
    klikKnop();
    fixture.destroy();
    expect(kiezer.dismiss).toHaveBeenCalledWith('Wens-popup gesloten');
  });

  it('zonder geopende kiezer: sluiten van de wens-popup gaat gewoon', () => {
    maak();
    expect(() => fixture.destroy()).not.toThrow();
  });
});
