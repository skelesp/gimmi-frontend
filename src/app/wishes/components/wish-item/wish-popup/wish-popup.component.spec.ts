import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal, NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';

import { CloudinaryService } from 'src/app/images/services/cloudinary.service';
import { Person } from 'src/app/people/models/person.model';
import { User } from 'src/app/users/models/user.model';
import { UserService } from 'src/app/users/service/user.service';
import { Wish } from 'src/app/wishes/models/wish.model';
import { WishService } from 'src/app/wishes/services/wish.service';
import { WishPopupComponent } from './wish-popup.component';

// Popup om een wens toe te voegen, aan te passen of te kopiëren (sc-2348). Sluit met de
// ingevulde wens; een tijdelijke afbeelding die niet bewaard wordt, gaat weer weg.
describe('WishPopupComponent', () => {
  const ria = new Person('ria', 'Ria', 'Receiver');
  let fixture: ComponentFixture<WishPopupComponent>;
  let component: WishPopupComponent;
  let activeModal: jasmine.SpyObj<NgbActiveModal>;
  let images: jasmine.SpyObj<CloudinaryService>;
  let wishService: jasmine.SpyObj<WishService>;

  function bestaandeWens(): Wish {
    const w = new Wish('w1', 'Fiets', 250, 'www.fiets.be', ria, ria, 'rood', 'L', 'Met bel', 1);
    w.image = { publicId: 'wish_images/w1', version: '3' } as any;
    return w;
  }

  function open(mode: 'edit' | 'create' | 'copy' | undefined, wens?: Wish) {
    fixture = TestBed.createComponent(WishPopupComponent);
    component = fixture.componentInstance;
    if (wens) component.wish = wens;
    component.mode = mode;
    fixture.detectChanges();
  }

  function veld(id: string): HTMLInputElement {
    return fixture.nativeElement.querySelector('#' + id);
  }

  function opslaan(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button[type="submit"]');
  }

  beforeEach(async () => {
    activeModal = jasmine.createSpyObj<NgbActiveModal>('NgbActiveModal', ['close', 'dismiss']);
    images = jasmine.createSpyObj<CloudinaryService>('CloudinaryService', ['isTemporaryImage', 'deleteImage']);
    images.deleteImage.and.returnValue(of(true));
    wishService = jasmine.createSpyObj<WishService>('WishService', ['getCopiesOnListOf']);
    wishService.getCopiesOnListOf.and.returnValue(of([]));
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, NgbAlertModule],
      declarations: [WishPopupComponent],
      providers: [
        { provide: NgbActiveModal, useValue: activeModal },
        { provide: UserService, useValue: { currentUser: new User('ria', 'Receiver', 'Ria', 'ria@gimmi.be', 'local', 't', {}) } },
        { provide: CloudinaryService, useValue: images },
        { provide: WishService, useValue: wishService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('titel en knoptekst per modus', () => {
    const verwacht: [any, string, string][] = [
      ['create', 'Voeg een wens toe', 'Wens toevoegen'],
      ['edit', 'Pas deze wens aan', 'Wens aanpassen'],
      ['copy', 'Kopieer deze wens op je lijst', 'Wens kopiëren'],
      [undefined, 'Pas deze wens aan', 'Wens opslaan']
    ];
    for (const [mode, titel, knop] of verwacht) {
      open(mode, bestaandeWens());
      expect(fixture.nativeElement.querySelector('.modal-title').textContent).toBe(titel);
      expect(opslaan().textContent).toBe(knop);
      fixture.destroy();
    }
  });

  it('aanpassen: het formulier staat ingevuld met de bestaande wens', () => {
    open('edit', bestaandeWens());
    expect(veld('wishTitle').value).toBe('Fiets');
    expect(veld('WishPrice').value).toBe('250');
    expect(veld('WishUrl').value).toBe('http://www.fiets.be');
    expect(veld('wishColor').value).toBe('rood');
    expect(veld('WishSize').value).toBe('L');
    expect(veld('wishDescription').value).toBe('Met bel');
  });

  it('nieuwe wens: titel is verplicht, opslaan pas mogelijk met een titel', () => {
    open('create');
    expect(fixture.nativeElement.textContent).toContain('Titel is een verplicht veld');
    expect(opslaan().disabled).toBeTrue();

    veld('wishTitle').value = 'Boek';
    veld('wishTitle').dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Titel is een verplicht veld');
    expect(opslaan().disabled).toBeFalse();
  });

  it('opslaan sluit de popup met de wens en de aangepaste velden', () => {
    const wens = bestaandeWens();
    open('edit', wens);
    veld('wishTitle').value = 'Elektrische fiets';
    veld('wishTitle').dispatchEvent(new Event('input'));
    fixture.detectChanges();
    opslaan().click();

    const resultaat = activeModal.close.calls.mostRecent().args[0];
    expect(resultaat.id).toBe('w1');
    expect(resultaat.title).toBe('Elektrische fiets');
    expect(resultaat.color).toBe('rood');
    expect(component.saving).toBeTrue();
  });

  it('een nieuw opgeladen afbeelding komt in het formulier en in de bewaarde wens', () => {
    open('create');
    const nieuw = { publicId: 'ria-12_temp', version: '7' } as any;
    fixture.debugElement.query(el => el.name === 'gimmi-image-upload').triggerEventHandler('imageUploaded', nieuw);
    expect(component.wishForm.get('image').value).toBe(nieuw);
  });

  it('upload-widget krijgt de eigen gebruiker als prefix voor de tijdelijke naam', () => {
    open('create');
    expect(fixture.debugElement.query(el => el.name === 'gimmi-image-upload').nativeElement.tempPublicId_prefix).toBe('ria');
  });

  it('annuleren en het kruisje sluiten de popup zonder wens', () => {
    open('create');
    fixture.nativeElement.querySelector('.modal-footer .btn-outline-danger').click();
    expect(activeModal.dismiss).toHaveBeenCalledWith('Cancel');
    fixture.nativeElement.querySelector('button.close').click();
    expect(activeModal.dismiss).toHaveBeenCalledWith('Cross click');
    expect(activeModal.close).not.toHaveBeenCalled();
  });

  it('kopiëren: waarschuwing als er al een kopie van deze wens op de lijst staat', () => {
    const kopie = { ...bestaandeWens(), id: undefined, copyOf: 'origineel' } as Wish;
    wishService.getCopiesOnListOf.and.returnValue(of([{ copyOf: 'origineel' } as Wish]));
    open('copy', kopie);
    expect(wishService.getCopiesOnListOf).toHaveBeenCalledWith(ria);
    expect(fixture.nativeElement.querySelector('ngb-alert').textContent).toContain('er staat al een kopie van deze wens op je lijst');
  });

  it('kopiëren zonder eerdere kopie: geen waarschuwing; buiten kopiëren wordt niets opgevraagd', () => {
    open('copy', { ...bestaandeWens(), copyOf: 'origineel' } as Wish);
    expect(fixture.nativeElement.querySelector('ngb-alert')).toBeNull();
    fixture.destroy();
    wishService.getCopiesOnListOf.calls.reset();
    open('edit', bestaandeWens());
    expect(wishService.getCopiesOnListOf).not.toHaveBeenCalled();
  });

  it('sluiten zonder opslaan: een tijdelijke afbeelding wordt bij Cloudinary verwijderd', () => {
    images.isTemporaryImage.and.returnValue(true);
    spyOn(console, 'info');
    open('create');
    const tijdelijk = { publicId: 'ria-12_temp', version: '7' } as any;
    component.updateWishImage(tijdelijk);
    fixture.destroy();
    expect(images.deleteImage).toHaveBeenCalledWith(tijdelijk);
  });

  it('sluiten na opslaan, of met een definitieve afbeelding: niets verwijderd', () => {
    images.isTemporaryImage.and.callFake(img => img.publicId.endsWith('_temp'));
    open('create');
    component.updateWishImage({ publicId: 'ria-12_temp', version: '7' } as any);
    component.saveWish();
    fixture.destroy();

    open('edit', bestaandeWens());
    fixture.destroy();
    expect(images.deleteImage).not.toHaveBeenCalled();
  });
});
