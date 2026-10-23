import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal, NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';

import { Person } from 'src/app/people/models/person.model';
import { User } from 'src/app/users/models/user.model';
import { UserService } from 'src/app/users/service/user.service';
import { Wish } from 'src/app/wishes/models/wish.model';
import { WishService } from 'src/app/wishes/services/wish.service';
import { WishPopupComponent } from './wish-popup.component';

// Popup om een wens toe te voegen, aan te passen of te kopiëren (sc-2348). Sluit met de
// ingevulde wens. Een opgeladen afbeelding heeft meteen een eigen sleutel in R2 (sc-2911):
// geen tijdelijke naam meer die de popup zelf moet opruimen.
describe('WishPopupComponent', () => {
  const ria = new Person('ria', 'Ria', 'Receiver');
  let fixture: ComponentFixture<WishPopupComponent>;
  let component: WishPopupComponent;
  let activeModal: jasmine.SpyObj<NgbActiveModal>;
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
    wishService = jasmine.createSpyObj<WishService>('WishService', ['getCopiesOnListOf']);
    wishService.getCopiesOnListOf.and.returnValue(of([]));
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, NgbAlertModule],
      declarations: [WishPopupComponent],
      providers: [
        { provide: NgbActiveModal, useValue: activeModal },
        { provide: UserService, useValue: { currentUser: new User('ria', 'Receiver', 'Ria', 'ria@gimmi.be', 'local', 't', {}) } },
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
    const nieuw = { key: 'wishes/a.jpg', url: 'u' };
    fixture.debugElement.query(el => el.name === 'gimmi-image-upload').triggerEventHandler('imageUploaded', nieuw);
    expect(component.wishForm.get('image').value).toBe(nieuw);
  });

  it('de voorvertoning van een net gekozen afbeelding gaat meteen naar de preview (sc-3028)', () => {
    open('create');
    expect(fixture.debugElement.query(el => el.name === 'gimmi-image-view').properties.preview).toBeNull();
    fixture.debugElement.query(el => el.name === 'gimmi-image-upload').triggerEventHandler('previewChanged', 'data:image/jpeg;base64,AAA');
    fixture.detectChanges();
    expect(component.imagePreview).toBe('data:image/jpeg;base64,AAA');
    expect(fixture.debugElement.query(el => el.name === 'gimmi-image-view').properties.preview).toBe('data:image/jpeg;base64,AAA');
  });

  it('de afbeeldingskiezer krijgt de titel als zoekterm, het voorbeeld een vaste breedte', () => {
    open('edit', bestaandeWens());
    expect(fixture.debugElement.query(el => el.name === 'gimmi-image-upload').properties.searchTerm).toBe('Fiets');
    expect(fixture.debugElement.query(el => el.name === 'gimmi-image-view').attributes.sizes).toBe('200px');
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

  it('aanpassen met een nieuwe afbeelding: de nieuwe sleutel gaat mee in de bewaarde wens', () => {
    open('edit', bestaandeWens());
    component.updateWishImage({ key: 'wishes/b.jpg', url: 'u' });
    component.saveWish();
    expect(activeModal.close.calls.mostRecent().args[0].image).toEqual({ key: 'wishes/b.jpg', url: 'u' });
  });
});
