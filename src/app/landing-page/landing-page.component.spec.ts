import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';

import { User } from '../users/models/user.model';
import { UserService } from '../users/service/user.service';
import { HowToUseComponent } from './how-to-use/how-to-use.component';
import { LandingPageBannerComponent } from './landing-page-banner/landing-page-banner.component';
import { LandingPageComponent } from './landing-page.component';

// Landingspagina (sc-1985): banner met call to action en "Hoe werkt het?".
// De call to action navigeert naar registreren of naar de eigen lijst (sc-2381).
describe('LandingPageComponent', () => {
  let fixture: ComponentFixture<LandingPageComponent>;
  let currentUser$: BehaviorSubject<User>;
  const ilse = new User('u1', 'Ingelogd', 'Ilse', 'ilse@gimmi.be', 'local', 't', {});

  function toon(user: User) {
    currentUser$.next(user);
    fixture = TestBed.createComponent(LandingPageComponent);
    fixture.detectChanges();
  }

  /** Zichtbare call-to-actionknoppen in de banner (groot en klein scherm), [tekst, href]. */
  function ctas(): [string, string][] {
    const links: HTMLAnchorElement[] = Array.from(fixture.nativeElement.querySelectorAll('gimmi-landing-page-banner a.btn'));
    return links.filter(a => !a.hidden).map(a => [a.textContent.trim(), a.getAttribute('href')]);
  }

  beforeEach(async () => {
    currentUser$ = new BehaviorSubject<User>(null);
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [LandingPageComponent, LandingPageBannerComponent, HowToUseComponent],
      providers: [{ provide: UserService, useValue: { currentUser$: currentUser$.asObservable() } }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('toont de banner en "Hoe werkt het?" met de vier stappen', () => {
    toon(null);
    expect(fixture.nativeElement.querySelector('gimmi-landing-page-banner')).toBeTruthy();
    const stappen = Array.from(fixture.nativeElement.querySelectorAll('gimmi-how-to-use h3')).map((h: HTMLElement) => h.textContent.trim());
    expect(stappen).toEqual(['Registreer', 'Voeg wensen toe', 'Verspreid je lijst', 'Krijg cadeaus!']);
  });

  it('banner heeft een versie voor grote en voor kleine schermen', () => {
    toon(null);
    const jumbotrons: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.jumbotron'));
    expect(jumbotrons.map(j => j.className)).toEqual([
      jasmine.stringMatching(/d-none d-md-block/),
      jasmine.stringMatching(/d-block d-md-none/)
    ]);
  });

  it('niet ingelogd: de call to action gaat naar registreren (sc-2381)', () => {
    toon(null);
    expect(ctas()).toEqual([
      ['Start nu met Gimmi en ontdek het zelf!', '/users/register'],
      ['Start nu met Gimmi en ontdek het zelf!', '/users/register']
    ]);
  });

  it('ingelogd: de call to action gaat naar de eigen overzichtspagina (sc-2381)', () => {
    toon(ilse);
    expect(ctas()).toEqual([
      ['Ga naar je overzichtspagina, Ilse!', '/people/u1'],
      ['Ga naar je overzichtspagina, Ilse!', '/people/u1']
    ]);
  });

  it('"Hoe werkt het?": niet ingelogd leidt de lijst-stap naar registreren en is er niets te delen', () => {
    toon(null);
    const iconen = fixture.debugElement.query(sel => sel.name === 'gimmi-how-to-use').componentInstance as HowToUseComponent;
    expect(iconen.currentUser).toBeNull();
    expect(fixture.nativeElement.querySelector('gimmi-how-to-use gimmi-share')).toBeNull();
  });

  it('"Hoe werkt het?": ingelogd verschijnt de deelknop met de eigen persoon', () => {
    toon(ilse);
    const share = fixture.debugElement.query(el => el.name === 'gimmi-share');
    expect(share).toBeTruthy();
    expect(share.nativeElement.personToShare).toBe(ilse);
  });

  it('stopt met luisteren naar de gebruiker bij het verlaten van de pagina', () => {
    toon(ilse);
    fixture.destroy();
    expect(currentUser$.observers.length).toBe(0);
  });
});
