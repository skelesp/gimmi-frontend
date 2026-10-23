import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';

import { ImageService } from 'src/app/images/services/image.service';
import { Person } from 'src/app/people/models/person.model';
import { PeopleService } from 'src/app/people/service/people.service';
import { CommunicationService } from 'src/app/shared/services/communication.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { User } from 'src/app/users/models/user.model';
import { UserService } from 'src/app/users/service/user.service';
import { Wish, wishStatus } from '../../../models/wish.model';
import { WishService } from '../../../services/wish.service';
import { GiftFeedbackComponent } from '../../gift-feedback/gift-feedback.component';
import { WishDeleteComponent } from '../../wish-delete/wish-delete.component';
import { ChangeWishReservationComponent } from '../../wish-reservation/change-wish-reservation/change-wish-reservation.component';
import { WishReservationComponent } from '../../wish-reservation/wish-reservation.component';
import { ActionListItemComponent } from '../action-list/action-list-item/action-list-item.component';
import { ActionListComponent } from '../action-list/action-list.component';
import { WishBannerComponent } from '../wish-banner/wish-banner.component';
import { WishCallToActionButtonComponent } from '../wish-call-to-action-button/wish-call-to-action-button.component';
import { WishPopupComponent } from '../wish-popup/wish-popup.component';
import { WishCardComponent } from './wish-card.component';

// Wat een wenskaart toont per scenario (sc-1955, sc-1960, sc-2446, sc-2453, sc-2558, sc-2566) en
// welke acties ze aanbiedt (sc-1978, sc-1982). Logica komt uit WishItemComponent.
describe('WishCardComponent', () => {
  const ria = new Person('ria', 'Ria', 'Receiver');
  const rob = new Person('rob', 'Rob', 'Reservator');
  const carl = new Person('carl', 'Carl', 'Creator');

  let fixture: ComponentFixture<WishCardComponent>;
  let component: WishCardComponent;
  let modal: jasmine.SpyObj<NgbModal>;
  let wishService: jasmine.SpyObj<WishService>;
  let images: jasmine.SpyObj<ImageService>;
  let people: jasmine.SpyObj<PeopleService>;
  let communication: jasmine.SpyObj<CommunicationService>;
  let notifications: jasmine.SpyObj<NotificationService>;
  let popup: { componentInstance: any; result: Promise<any> };

  function maakWens(opties: { status: wishStatus; createdBy?: Person; reservedBy?: Person; url?: string; viewer: string }): Wish {
    const w = new Wish('w1', 'Boek', 20, opties.url ?? null, ria, opties.createdBy ?? ria, null, null, null, 1);
    w.status = opties.status;
    if (opties.reservedBy) w.reservation = { reservedBy: opties.reservedBy, amount: 1, reservationDate: null, reason: null };
    w.setUserIsFlags(new User(opties.viewer, 'X', 'Y', 'x@gimmi.be', 'local', 't', []));
    return w;
  }

  function toon(wens: Wish) {
    fixture = TestBed.createComponent(WishCardComponent);
    component = fixture.componentInstance;
    component.wish = wens;
    fixture.detectChanges();
  }

  function banner(): string {
    return (fixture.nativeElement.querySelector('gimmi-wish-banner')?.textContent || '').trim();
  }

  function cta(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('gimmi-wish-call-to-action-button button');
  }

  function geblurd(): boolean {
    return fixture.nativeElement.querySelector('.card-img-overlay').classList.contains('blurred-card-overlay');
  }

  function acties(): string[] {
    return component.wishActionItems.map(a => a.text);
  }

  beforeEach(async () => {
    popup = { componentInstance: {}, result: new Promise(() => {}) };
    modal = jasmine.createSpyObj<NgbModal>('NgbModal', ['open']);
    modal.open.and.callFake(() => popup as any);
    wishService = jasmine.createSpyObj<WishService>('WishService', ['addGiftFeedback', 'close', 'update', 'create']);
    images = jasmine.createSpyObj<ImageService>('ImageService', ['uploadImage', 'heeftBeeld']);
    people = jasmine.createSpyObj<PeopleService>('PeopleService', ['getEmailById']);
    communication = jasmine.createSpyObj<CommunicationService>('CommunicationService', ['sendMail']);
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['showNotification']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, FontAwesomeModule, NgbDropdownModule],
      declarations: [WishCardComponent, WishBannerComponent, WishCallToActionButtonComponent, ActionListComponent, ActionListItemComponent],
      providers: [
        { provide: NgbModal, useValue: modal },
        { provide: WishService, useValue: wishService },
        { provide: NotificationService, useValue: notifications },
        { provide: UserService, useValue: { currentUser: new User('rob', 'Reservator', 'Rob', 'rob@gimmi.be', 'local', 't', []) } },
        { provide: ImageService, useValue: images },
        { provide: PeopleService, useValue: people },
        { provide: CommunicationService, useValue: communication }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA] // gimmi-image-view
    }).compileComponents();
  });

  describe('banner, knop en vervaging per scenario', () => {
    const gevallen: { naam: string; wens: () => Wish; banner: string; knop: string | null; blur: boolean }[] = [
      { naam: 'open wens van een ander', wens: () => maakWens({ status: 'Open', viewer: 'rob' }), banner: '', knop: 'Reserveer', blur: false },
      { naam: 'open wens, jouw idee voor iemand anders', wens: () => maakWens({ status: 'Open', createdBy: carl, viewer: 'carl' }), banner: 'Jouw idee', knop: 'Reserveer', blur: false },
      { naam: 'gereserveerd door een ander', wens: () => maakWens({ status: 'Reserved', reservedBy: rob, viewer: 'iemand' }), banner: 'Gereserveerd', knop: null, blur: true },
      { naam: 'gereserveerd door jou', wens: () => maakWens({ status: 'Reserved', reservedBy: rob, viewer: 'rob' }), banner: 'Gereserveerd door jou', knop: 'Verwijder reservatie', blur: true },
      { naam: 'gereserveerd, bekeken door de ontvanger (incognito)', wens: () => maakWens({ status: 'Reserved', reservedBy: rob, viewer: 'ria' }), banner: '', knop: 'Reserveer', blur: false },
      { naam: 'ontvangen, bekeken door de ontvanger', wens: () => maakWens({ status: 'Received', reservedBy: rob, viewer: 'ria' }), banner: 'Ontvangen', knop: 'Geef feedback', blur: true },
      { naam: 'ontvangen, gegeven door jou', wens: () => maakWens({ status: 'Received', reservedBy: rob, viewer: 'rob' }), banner: 'Gegeven door jou', knop: null, blur: true },
      { naam: 'ontvangen, bekeken door een derde', wens: () => maakWens({ status: 'Received', reservedBy: rob, viewer: 'iemand' }), banner: 'Ontvangen', knop: null, blur: true },
      { naam: 'vervuld', wens: () => maakWens({ status: 'Fulfilled', reservedBy: rob, viewer: 'ria' }), banner: 'Wens vervuld', knop: null, blur: true },
      { naam: 'vervuld door jou', wens: () => maakWens({ status: 'Fulfilled', reservedBy: rob, viewer: 'rob' }), banner: 'Wens vervuld door jou', knop: null, blur: true }
    ];

    gevallen.forEach(g => {
      it(g.naam, () => {
        toon(g.wens());
        expect(banner()).toBe(g.banner);
        if (g.knop) expect(cta().textContent.trim()).toBe(g.knop);
        else expect(cta()).toBeNull();
        expect(geblurd()).toBe(g.blur);
      });
    });
  });

  describe('acties in het menu', () => {
    it('eigen wens: aanpassen en verwijderen, niet kopiëren', () => {
      toon(maakWens({ status: 'Open', viewer: 'ria' }));
      expect(acties()).toEqual(['Aanpassen', 'Verwijderen']);
    });

    it('wens van een ander: enkel op eigen lijst zetten', () => {
      toon(maakWens({ status: 'Open', viewer: 'rob' }));
      expect(acties()).toEqual(['Zet op eigen lijst']);
    });

    it('idee dat je voor een ander aanmaakte: aanpassen, kopiëren en verwijderen', () => {
      toon(maakWens({ status: 'Open', createdBy: carl, viewer: 'carl' }));
      expect(acties()).toEqual(['Aanpassen', 'Zet op eigen lijst', 'Verwijderen']);
    });

    it('met een url: "Externe website" bovenaan, met die url', () => {
      toon(maakWens({ status: 'Open', viewer: 'rob', url: 'www.winkel.be' }));
      expect(acties()[0]).toBe('Externe website');
      expect(component.wishActionItems[0].url).toBe('http://www.winkel.be');
    });

    it('"Toegevoegd door" enkel als iemand anders de wens aanmaakte', () => {
      toon(maakWens({ status: 'Open', createdBy: carl, viewer: 'rob' }));
      expect(fixture.nativeElement.textContent).toContain('Toegevoegd door Carl C.');
      toon(maakWens({ status: 'Open', viewer: 'rob' }));
      expect(fixture.nativeElement.textContent).not.toContain('Toegevoegd door');
    });
  });

  describe('popups', () => {
    it('Reserveer opent de reservatiepopup met deze wens', () => {
      toon(maakWens({ status: 'Open', viewer: 'rob' }));
      cta().click();
      expect(modal.open).toHaveBeenCalledWith(WishReservationComponent);
      expect(popup.componentInstance.wish).toBe(component.wish);
    });

    it('Verwijder reservatie opent de popup om de reservatie te wijzigen', () => {
      toon(maakWens({ status: 'Reserved', reservedBy: rob, viewer: 'rob' }));
      cta().click();
      expect(modal.open).toHaveBeenCalledWith(ChangeWishReservationComponent);
    });

    it('verwijderen opent de bevestiging', () => {
      toon(maakWens({ status: 'Open', viewer: 'ria' }));
      component.delete();
      expect(modal.open).toHaveBeenCalledWith(WishDeleteComponent);
    });

    it('aanpassen: popup in edit-modus, en na opslaan wordt de wens bijgewerkt', fakeAsync(() => {
      spyOn(console, 'info');
      const wens = maakWens({ status: 'Open', viewer: 'ria' });
      popup.result = Promise.resolve(wens);
      wishService.update.and.returnValue(of(wens));
      toon(wens);
      component.edit();
      flushMicrotasks();
      expect(modal.open).toHaveBeenCalledWith(WishPopupComponent);
      expect(popup.componentInstance.mode).toBe('edit');
      expect(wishService.update).toHaveBeenCalledWith(wens);
    }));

    it('kopiëren: popup in copy-modus met de ingelogde gebruiker als ontvanger, daarna aangemaakt', fakeAsync(() => {
      images.heeftBeeld.and.returnValue(false);
      const kopie = maakWens({ status: 'Open', viewer: 'rob' });
      popup.result = Promise.resolve(kopie);
      wishService.create.and.returnValue(of(kopie));
      toon(maakWens({ status: 'Open', viewer: 'rob' }));
      component.copy();
      flushMicrotasks();
      expect(popup.componentInstance.mode).toBe('copy');
      expect(popup.componentInstance.wish.copyOf).toBe('w1');
      expect(popup.componentInstance.wish.id).toBeUndefined();
      expect(popup.componentInstance.wish.receiver.id).toBe('rob');
      expect(wishService.create).toHaveBeenCalledWith(kopie);
      expect(notifications.showNotification).toHaveBeenCalledWith("De wens 'Boek' werd toegevoegd aan je lijst.", 'success', 'Wens gekopieerd');
      expect(popup.componentInstance.wish.image).toBeNull();
      expect(images.uploadImage).not.toHaveBeenCalled();
    }));

    // Afbeelding bij het kopiëren (sc-2911).
    function kopieer(image: any) {
      const origineel = maakWens({ status: 'Open', viewer: 'rob' });
      origineel.image = image;
      toon(origineel);
      component.copy();
      flushMicrotasks();
    }

    it('kopiëren met een R2-beeld: de kopie deelt de sleutel, niets opgeladen', fakeAsync(() => {
      images.heeftBeeld.and.returnValue(true);
      kopieer({ key: 'wishes/a.jpg', url: 'u' });
      expect(popup.componentInstance.wish.image).toEqual({ key: 'wishes/a.jpg', url: 'u' });
      expect(images.uploadImage).not.toHaveBeenCalled();
    }));

    it('feedback: slaat feedback op, sluit de wens en mailt de gever de boodschap', fakeAsync(() => {
      const wens = maakWens({ status: 'Received', reservedBy: rob, viewer: 'ria' });
      const feedback = { satisfaction: '5', receivedOn: null, message: 'Merci!', putBackOnList: false };
      popup.result = Promise.resolve(feedback);
      const gesloten = maakWens({ status: 'Fulfilled', reservedBy: rob, viewer: 'ria' });
      gesloten.giftFeedback = feedback;
      wishService.addGiftFeedback.and.returnValue(of(wens));
      wishService.close.and.returnValue(of(gesloten));
      people.getEmailById.and.returnValue(of('rob@gimmi.be'));
      toon(wens);
      cta().click();
      flushMicrotasks();
      expect(modal.open).toHaveBeenCalledWith(GiftFeedbackComponent);
      expect(wishService.addGiftFeedback).toHaveBeenCalledWith(wens, feedback);
      expect(wishService.close).toHaveBeenCalledWith(wens);
      const mail = communication.sendMail.calls.mostRecent().args[0];
      expect(mail.to).toBe('rob@gimmi.be');
      expect(mail.subject).toBe('[GIMMI] Ria Receiver bedankt je voor je cadeau!!');
      expect(mail.html).toContain('Merci!');
    }));

    it('feedback zonder boodschap: geen mail', fakeAsync(() => {
      const wens = maakWens({ status: 'Received', reservedBy: rob, viewer: 'ria' });
      const feedback = { satisfaction: '4', receivedOn: null, message: '', putBackOnList: false };
      popup.result = Promise.resolve(feedback);
      const gesloten = maakWens({ status: 'Fulfilled', reservedBy: rob, viewer: 'ria' });
      gesloten.giftFeedback = feedback;
      wishService.addGiftFeedback.and.returnValue(of(wens));
      wishService.close.and.returnValue(of(gesloten));
      toon(wens);
      cta().click();
      flushMicrotasks();
      expect(communication.sendMail).not.toHaveBeenCalled();
    }));
  });
});
