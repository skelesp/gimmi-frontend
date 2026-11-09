import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbCollapseModule, NgbConfig } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject } from 'rxjs';

import { User } from 'src/app/users/models/user.model';
import { UserService } from 'src/app/users/service/user.service';
import { NavigationBarComponent } from './navigation-bar.component';
import { BrandLogoComponent } from '../brand-logo/brand-logo.component';
import { PeopleSearchComponent } from '../../../people/components/people-search/people-search.component';
import { UserMenuComponent } from '../../../users/components/user-menu/user-menu.component';
import { UnknownUserMenuComponent } from '../../../users/components/unknown-user-menu/unknown-user-menu.component';

// Navigatiebalk (sc-2001). Het zoekveld staat vast in de balk en niet in het inklapmenu (sc-41).
describe('NavigationBarComponent', () => {
    let fixture: ComponentFixture<NavigationBarComponent>;
    let currentUser$: BehaviorSubject<User>;
    const ilse = new User('u1', 'Ingelogd', 'Ilse', 'ilse@gimmi.be', 'local', 't', []);

    async function toon(user: User) {
        currentUser$.next(user);
        fixture = TestBed.createComponent(NavigationBarComponent);
        await fixture.whenStable();
    }

    function el(): HTMLElement { return fixture.nativeElement; }

    beforeEach(async () => {
        currentUser$ = new BehaviorSubject<User>(null);
        TestBed.overrideComponent(NavigationBarComponent, { remove: { imports: [BrandLogoComponent, PeopleSearchComponent, UserMenuComponent, UnknownUserMenuComponent] }, add: { schemas: [NO_ERRORS_SCHEMA] } });
        await TestBed.configureTestingModule({
    imports: [NgbCollapseModule, NavigationBarComponent],
    providers: [{ provide: UserService, useValue: { currentUser$: currentUser$.asObservable() } }],
    schemas: [NO_ERRORS_SCHEMA]
}).compileComponents();
        // Zonder animatie staat het menu meteen open of dicht (anders tijdelijk "collapsing").
        TestBed.inject(NgbConfig).animation = false;
    });

    it('logo en zoekveld staan altijd in de balk, het zoekveld buiten het inklapmenu (sc-41)', async () => {
        await toon(null);
        expect(el().querySelector('.navbar-brand gimmi-brand-logo')).toBeTruthy();
        const zoek = el().querySelector('gimmi-people-search');
        expect(zoek).toBeTruthy();
        expect(zoek.closest('.navbar-collapse')).toBeNull();
    });

    it('niet ingelogd: menuknop en een ingeklapt menu voor onbekende gebruikers', async () => {
        await toon(null);
        expect(el().querySelector('button.navbar-toggler')).toBeTruthy();
        expect(el().querySelector('gimmi-user-menu')).toBeNull();
        const menu = el().querySelector('.navbar-collapse');
        expect(menu.querySelector('gimmi-unknown-user-menu')).toBeTruthy();
        expect(menu.classList).not.toContain('show');
    });

    it('de menuknop klapt het menu open en weer dicht', async () => {
        await toon(null);
        const knop: HTMLButtonElement = el().querySelector('button.navbar-toggler');
        knop.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.isNavbarCollapsed).toBe(false);
        expect(el().querySelector('.navbar-collapse').classList).toContain('show');
        knop.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.isNavbarCollapsed).toBe(true);
    });

    it('een keuze in het menu klapt het weer dicht', async () => {
        await toon(null);
        fixture.componentInstance.toggleNavbarCollapseState();
        await fixture.whenStable();
        fixture.debugElement.query(e => e.name === 'gimmi-unknown-user-menu').triggerEventHandler('menuItemClicked', null);
        expect(fixture.componentInstance.isNavbarCollapsed).toBe(true);
    });

    it('ingelogd: gebruikersmenu, geen menuknop en geen menu voor onbekenden', async () => {
        await toon(ilse);
        expect(el().querySelector('gimmi-user-menu')).toBeTruthy();
        expect(el().querySelector('button.navbar-toggler')).toBeNull();
        expect(el().querySelector('gimmi-unknown-user-menu')).toBeNull();
    });

    it('volgt in- en uitloggen', async () => {
        await toon(null);
        currentUser$.next(ilse);
        await fixture.whenStable();
        expect(el().querySelector('gimmi-user-menu')).toBeTruthy();
        currentUser$.next(null);
        await fixture.whenStable();
        expect(el().querySelector('gimmi-user-menu')).toBeNull();
    });

    it('stopt met luisteren bij het verdwijnen van de balk', async () => {
        await toon(null);
        fixture.destroy();
        expect(currentUser$.observers.length).toBe(0);
    });
});
