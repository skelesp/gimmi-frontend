import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject } from 'rxjs';

import { ImageService } from 'src/app/images/services/image.service';
import { Person } from 'src/app/people/models/person.model';
import { PeopleService } from 'src/app/people/service/people.service';
import { CommunicationService } from 'src/app/shared/services/communication.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { User } from 'src/app/users/models/user.model';
import { UserService } from 'src/app/users/service/user.service';
import { Wish, wishStatus } from 'src/app/wishes/models/wish.model';
import { WishService } from 'src/app/wishes/services/wish.service';
import { WishPageComponent } from './wish-page.component';

// Detailpagina van een wens op /wishes/:wishId (sc-1958): toont de geselecteerde wens uit de
// WishService, hergebruikt banner, knop en actielijst van de wenskaart, en volgt wijzigingen.
describe('WishPageComponent', () => {
  const ria = new Person('ria', 'Ria', 'Receiver');
  const rob = new Person('rob', 'Rob', 'Reservator');
  const carl = new Person('carl', 'Carl', 'Creator');

  let fixture: ComponentFixture<WishPageComponent>;
  let component: WishPageComponent;
  let selectedWish$: BehaviorSubject<Wish>;

  function maakWens(opties: { status?: wishStatus; viewer: string; reservedBy?: Person; url?: string; extra?: Partial<Wish> }): Wish {
    const w = new Wish('w1', 'Fiets', 250, opties.url ?? null, ria, carl, null, null, null, 1);
    w.status = opties.status ?? 'Open';
    w.createdAt = new Date(2026, 9, 3);
    if (opties.reservedBy) w.reservation = { reservedBy: opties.reservedBy, amount: 1, reservationDate: new Date(), reason: 'Verjaardag' };
    Object.assign(w, opties.extra ?? {});
    w.setUserIsFlags(new User(opties.viewer, 'X', 'Y', 'x@gimmi.be', 'local', 't', []));
    return w;
  }

  function toon(wens: Wish) {
    selectedWish$.next(wens);
    fixture = TestBed.createComponent(WishPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  /** Tekst van de zichtbare regels in de detaillijst. */
  function regels(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('li.list-group-item') as NodeListOf<HTMLElement>)
      .filter(li => !li.hidden)
      .map(li => li.textContent.replace(/\s+/g, ' ').trim());
  }

  beforeEach(async () => {
    selectedWish$ = new BehaviorSubject<Wish>(null);
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [WishPageComponent],
      providers: [
        { provide: WishService, useValue: { selectedWish: selectedWish$.asObservable() } },
        { provide: NgbModal, useValue: jasmine.createSpyObj('NgbModal', ['open']) },
        { provide: NotificationService, useValue: {} },
        { provide: UserService, useValue: {} },
        { provide: ImageService, useValue: {} },
        { provide: PeopleService, useValue: {} },
        { provide: CommunicationService, useValue: {} },
        { provide: ActivatedRoute, useValue: {} }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('toont titel, ontvanger, prijs en een link terug naar de lijst', () => {
    toon(maakWens({ viewer: 'rob' }));
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h2').textContent).toBe('Fiets');
    expect(el.querySelector('h6').textContent).toContain('voor Ria Receiver');
    expect(el.querySelector('.badge-warning').textContent).toContain('250.00');
    const terug = el.querySelector('a.badge-secondary');
    expect(terug.textContent).toContain('Terug naar lijst');
    expect(terug.getAttribute('href')).toBe('/people/ria');
  });

  it('open wens bij een ander: datum, maker, nog niet gereserveerd; lege velden verborgen', () => {
    toon(maakWens({ viewer: 'rob' }));
    expect(regels()).toEqual(['Toegevoegd op: 03/10/26', 'Idee van: Carl Creator', 'Nog niet gereserveerd']);
  });

  it('kleur, maat, beschrijving en externe website verschijnen als ze ingevuld zijn', () => {
    toon(maakWens({ viewer: 'rob', url: 'www.voorbeeld.be', extra: { color: 'rood', size: 'L', description: 'Met bel' } }));
    expect(regels()).toEqual(jasmine.arrayContaining(['Externe website', 'rood', 'L', 'Met bel']));
    expect(fixture.nativeElement.querySelector('a[target="_blank"]').getAttribute('href')).toBe('http://www.voorbeeld.be');
  });

  it('gereserveerd door een ander: wie reserveerde, zonder knop', () => {
    toon(maakWens({ viewer: 'carl', status: 'Reserved', reservedBy: rob }));
    expect(component.wish.scenario).toBe('RESERVED');
    expect(regels()).toContain('Gereserveerd door: Rob Reservator');
    expect(regels()).not.toContain('Nog niet gereserveerd');
  });

  it('gereserveerd, bekeken door de ontvanger: incognito, de reservatie blijft verborgen', () => {
    toon(maakWens({ viewer: 'ria', status: 'Reserved', reservedBy: rob }));
    expect(component.wish.scenario).toBe('RESERVED_INCOGNITO_FOR_USER');
    expect(regels()).toContain('Nog niet gereserveerd');
    expect(regels().join()).not.toContain('Rob');
  });

  it('afgesloten wens: afsluitdatum', () => {
    toon(maakWens({ viewer: 'rob', status: 'Fulfilled', reservedBy: rob,
      extra: { closure: { closedBy: ria, closedOn: new Date(2026, 9, 5), reason: 'Ontvangen' } as any } }));
    expect(regels()).toContain('Afgesloten op: 05 / 10 / 26');
  });

  it('geeft banner en knop van het scenario door, zoals op de wenskaart', () => {
    toon(maakWens({ viewer: 'rob', status: 'Reserved', reservedBy: rob }));
    const banner = fixture.debugElement.query(el => el.name === 'gimmi-wish-banner').nativeElement;
    const cta = fixture.debugElement.query(el => el.name === 'gimmi-wish-call-to-action-button').nativeElement;
    expect(banner.bannerConfig.text).toBe('Gereserveerd door jou');
    expect(cta.CTAconfig.text).toBe('Verwijder reservatie');
  });

  it('actielijst voor de ontvanger: aanpassen en verwijderen, niet kopiëren', () => {
    toon(maakWens({ viewer: 'ria' }));
    expect(component.wishActionItems.map(a => a.text)).toEqual(['Aanpassen', 'Verwijderen']);
    expect(fixture.debugElement.query(el => el.name === 'gimmi-action-list').nativeElement.actionListItems)
      .toBe(component.wishActionItems);
  });

  it('volgt de geselecteerde wens: een wijziging (bv. een reservatie) is meteen zichtbaar', () => {
    toon(maakWens({ viewer: 'rob' }));
    const gewijzigd = maakWens({ viewer: 'rob', extra: { title: 'Fiets met mand' } });
    selectedWish$.next(gewijzigd);
    fixture.detectChanges();
    expect(component.wish).toBe(gewijzigd);
    expect(fixture.nativeElement.querySelector('h2').textContent).toBe('Fiets met mand');
  });
});
