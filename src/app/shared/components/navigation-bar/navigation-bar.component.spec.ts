import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbCollapseModule, NgbConfig } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject } from 'rxjs';

import { User } from 'src/app/users/models/user.model';
import { UserService } from 'src/app/users/service/user.service';
import { NavigationBarComponent } from './navigation-bar.component';

// Navigatiebalk (sc-2001). Het zoekveld staat vast in de balk en niet in het inklapmenu (sc-41).
describe('NavigationBarComponent', () => {
  let fixture: ComponentFixture<NavigationBarComponent>;
  let currentUser$: BehaviorSubject<User>;
  const ilse = new User('u1', 'Ingelogd', 'Ilse', 'ilse@gimmi.be', 'local', 't', {});

  function toon(user: User) {
    currentUser$.next(user);
    fixture = TestBed.createComponent(NavigationBarComponent);
    fixture.detectChanges();
  }

  function el(): HTMLElement { return fixture.nativeElement; }

  beforeEach(async () => {
    currentUser$ = new BehaviorSubject<User>(null);
    await TestBed.configureTestingModule({
      imports: [NgbCollapseModule],
      declarations: [NavigationBarComponent],
      providers: [{ provide: UserService, useValue: { currentUser$: currentUser$.asObservable() } }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    // Zonder animatie staat het menu meteen open of dicht (anders tijdelijk "collapsing").
    TestBed.inject(NgbConfig).animation = false;
  });

  it('logo en zoekveld staan altijd in de balk, het zoekveld buiten het inklapmenu (sc-41)', () => {
    toon(null);
    expect(el().querySelector('.navbar-brand gimmi-brand-logo')).toBeTruthy();
    const zoek = el().querySelector('gimmi-people-search');
    expect(zoek).toBeTruthy();
    expect(zoek.closest('.navbar-collapse')).toBeNull();
  });

  it('niet ingelogd: menuknop en een ingeklapt menu voor onbekende gebruikers', () => {
    toon(null);
    expect(el().querySelector('button.navbar-toggler')).toBeTruthy();
    expect(el().querySelector('gimmi-user-menu')).toBeNull();
    const menu = el().querySelector('.navbar-collapse');
    expect(menu.querySelector('gimmi-unknown-user-menu')).toBeTruthy();
    expect(menu.classList).not.toContain('show');
  });

  it('de menuknop klapt het menu open en weer dicht', () => {
    toon(null);
    const knop: HTMLButtonElement = el().querySelector('button.navbar-toggler');
    knop.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.isNavbarCollapsed).toBeFalse();
    expect(el().querySelector('.navbar-collapse').classList).toContain('show');
    knop.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.isNavbarCollapsed).toBeTrue();
  });

  it('een keuze in het menu klapt het weer dicht', () => {
    toon(null);
    fixture.componentInstance.toggleNavbarCollapseState();
    fixture.detectChanges();
    fixture.debugElement.query(e => e.name === 'gimmi-unknown-user-menu').triggerEventHandler('menuItemClicked', null);
    expect(fixture.componentInstance.isNavbarCollapsed).toBeTrue();
  });

  it('ingelogd: gebruikersmenu, geen menuknop en geen menu voor onbekenden', () => {
    toon(ilse);
    expect(el().querySelector('gimmi-user-menu')).toBeTruthy();
    expect(el().querySelector('button.navbar-toggler')).toBeNull();
    expect(el().querySelector('gimmi-unknown-user-menu')).toBeNull();
  });

  it('volgt in- en uitloggen', () => {
    toon(null);
    currentUser$.next(ilse);
    fixture.detectChanges();
    expect(el().querySelector('gimmi-user-menu')).toBeTruthy();
    currentUser$.next(null);
    fixture.detectChanges();
    expect(el().querySelector('gimmi-user-menu')).toBeNull();
  });

  it('stopt met luisteren bij het verdwijnen van de balk', () => {
    toon(null);
    fixture.destroy();
    expect(currentUser$.observers.length).toBe(0);
  });
});
