import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbCollapseModule, NgbConfig } from '@ng-bootstrap/ng-bootstrap';

import { AuthStore, CurrentUser } from 'src/app/core/auth/auth-store';
import { fakeAuthStore, testUser } from 'src/app/core/auth/auth-store.testing';
import { NavigationBar } from './navigation-bar';
import { BrandLogo } from '../brand-logo/brand-logo';
import { PeopleSearch } from '../../../features/people/components/people-search/people-search';
import { UserMenu } from '../../../features/users/components/user-menu/user-menu';
import { UnknownUserMenu } from '../../../features/users/components/unknown-user-menu/unknown-user-menu';

// Navigation bar (sc-2001). The search field is fixed in the bar and not in the collapsible menu (sc-41).
describe('NavigationBar', () => {
    let fixture: ComponentFixture<NavigationBar>;
    let auth: ReturnType<typeof fakeAuthStore>;
    const ilse = testUser({ id: 'u1', firstName: 'Ilse', lastName: 'Ingelogd', fullName: 'Ilse Ingelogd', email: 'ilse@gimmi.be' });

    async function show(user: CurrentUser) {
        auth.user.set(user);
        fixture = TestBed.createComponent(NavigationBar);
        await fixture.whenStable();
    }

    function el(): HTMLElement { return fixture.nativeElement; }

    beforeEach(async () => {
        auth = fakeAuthStore(null);
        TestBed.overrideComponent(NavigationBar, { remove: { imports: [BrandLogo, PeopleSearch, UserMenu, UnknownUserMenu] }, add: { schemas: [NO_ERRORS_SCHEMA] } });
        await TestBed.configureTestingModule({
    imports: [NgbCollapseModule, NavigationBar],
    providers: [{ provide: AuthStore, useValue: auth }],
    schemas: [NO_ERRORS_SCHEMA]
}).compileComponents();
        // Without animation the menu is open or closed right away (otherwise temporarily "collapsing").
        TestBed.inject(NgbConfig).animation = false;
    });

    it('logo and search field are always in the bar, the search field outside the collapsible menu (sc-41)', async () => {
        await show(null);
        expect(el().querySelector('.navbar-brand gimmi-brand-logo')).toBeTruthy();
        const search = el().querySelector('gimmi-people-search');
        expect(search).toBeTruthy();
        expect(search.closest('.navbar-collapse')).toBeNull();
    });

    it('not logged in: menu button and a collapsed menu for unknown users', async () => {
        await show(null);
        expect(el().querySelector('button.navbar-toggler')).toBeTruthy();
        expect(el().querySelector('gimmi-user-menu')).toBeNull();
        const menu = el().querySelector('.navbar-collapse');
        expect(menu.querySelector('gimmi-unknown-user-menu')).toBeTruthy();
        expect(menu.classList).not.toContain('show');
    });

    it('the menu button opens the menu and closes it again', async () => {
        await show(null);
        const button: HTMLButtonElement = el().querySelector('button.navbar-toggler');
        button.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.isNavbarCollapsed).toBe(false);
        expect(el().querySelector('.navbar-collapse').classList).toContain('show');
        button.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.isNavbarCollapsed).toBe(true);
    });

    it('a choice in the menu collapses it again', async () => {
        await show(null);
        fixture.componentInstance.toggleNavbarCollapseState();
        await fixture.whenStable();
        fixture.debugElement.query(e => e.name === 'gimmi-unknown-user-menu').triggerEventHandler('menuItemClicked', null);
        expect(fixture.componentInstance.isNavbarCollapsed).toBe(true);
    });

    it('logged in: user menu, no menu button and no menu for unknown users', async () => {
        await show(ilse);
        expect(el().querySelector('gimmi-user-menu')).toBeTruthy();
        expect(el().querySelector('button.navbar-toggler')).toBeNull();
        expect(el().querySelector('gimmi-unknown-user-menu')).toBeNull();
    });

    it('follows logging in and out', async () => {
        await show(null);
        auth.user.set(ilse);
        await fixture.whenStable();
        expect(el().querySelector('gimmi-user-menu')).toBeTruthy();
        auth.user.set(null);
        await fixture.whenStable();
        expect(el().querySelector('gimmi-user-menu')).toBeNull();
    });

});
