import type { Mock } from "vitest";
import { NO_ERRORS_SCHEMA, SimpleChange, WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbAlertModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';

import { Person } from 'src/app/features/people/models/person.model';
import { Wish, wishStatus } from '../../models/wish.model';
import { FilterOnStatePipe } from '../../pipes/filter-on-state-pipe';
import { WishesData } from '../../wishes-data';
import { ApiProblem } from 'src/app/core/api/api-problem';
import { ProblemNotifier } from 'src/app/core/api/problem-notifier';
import { WishList } from './wish-list';
import { WishCreateCard } from '../wish-create-card/wish-create-card';
import { WishCard } from '../wish-item/wish-card/wish-card';

// Wenslijst (sc-2300) met de tab "Ontvangen cadeaus" in plaats van een popup (sc-1984).
describe('WishList', () => {
    const ria = new Person('ria', 'Ria', 'Receiver');
    let fixture: ComponentFixture<WishList>;
    let component: WishList;
    let wishes: WritableSignal<Wish[]>;
    let antwoord$: Subject<Wish[]>;
    let problems: { show: Mock };
    let wishService: {
        wishes: any;
        getWishlist: Mock;
    };

    function wens(titel: string, status: wishStatus): Wish {
        const w = new Wish(titel, titel, 10, null, ria, ria, null, null, null, 1);
        w.status = status;
        return w;
    }

    async function laad(lijst: Wish[]) {
        component.receiver = ria;
        component.ngOnChanges({ receiver: new SimpleChange(null, ria, true) });
        await fixture.whenStable();
        wishes.set(lijst);
        antwoord$.next(lijst);
        await fixture.whenStable();
    }

    function kaarten(): string[] {
        return fixture.debugElement.queryAll(el => el.name === 'gimmi-wish-card').map(el => el.nativeElement.wish.title);
    }

    async function klikTab(tekst: string) {
        const tab: HTMLElement = Array.from(fixture.nativeElement.querySelectorAll('.nav-tabs button') as NodeListOf<HTMLElement>)
            .find(a => a.textContent.trim() === tekst);
        tab.click();
        await fixture.whenStable();
    }

    beforeEach(async () => {
        wishes = signal<Wish[]>([]);
        antwoord$ = new Subject<Wish[]>();
        problems = { show: vi.fn().mockName('ProblemNotifier.show') };
        wishService = { wishes: wishes.asReadonly(), getWishlist: vi.fn().mockName('getWishlist').mockReturnValue(antwoord$) };
        TestBed.overrideComponent(WishList, { remove: { imports: [WishCreateCard, WishCard] }, add: { schemas: [NO_ERRORS_SCHEMA] } });
        await TestBed.configureTestingModule({
    imports: [NgbNavModule, NgbAlertModule, WishList, FilterOnStatePipe],
    providers: [{ provide: WishesData, useValue: wishService }, { provide: ProblemNotifier, useValue: problems }],
    schemas: [NO_ERRORS_SCHEMA]
}).compileComponents();
        fixture = TestBed.createComponent(WishList);
        component = fixture.componentInstance;
    });

    it('haalt de lijst op bij een nieuwe ontvanger en toont intussen een spinner', async () => {
        component.receiver = ria;
        component.ngOnChanges({ receiver: new SimpleChange(null, ria, true) });
        await fixture.whenStable();
        expect(wishService.getWishlist).toHaveBeenCalledWith(ria);
        expect(component.loading()).toBe(true);
        expect(fixture.nativeElement.querySelector('.spinner-border')).toBeTruthy();

        antwoord$.next([]);
        await fixture.whenStable();
        expect(component.loading()).toBe(false);
        expect(fixture.nativeElement.querySelector('.spinner-border')).toBeNull();
    });

    it('een fout van de server stopt de spinner en wordt gemeld', async () => {
        const problem = new ApiProblem({ status: 404, code: 'not-found' as never });
        component.receiver = ria;
        component.ngOnChanges({ receiver: new SimpleChange(null, ria, true) });
        antwoord$.error(problem);
        await fixture.whenStable();
        expect(component.loading()).toBe(false);
        expect(problems.show).toHaveBeenCalledWith(problem);
    });

    it('andere wijziging dan de ontvanger: geen nieuwe ophaling', () => {
        component.ngOnChanges({ wishlistFilter: new SimpleChange(null, ['Open'], true) });
        expect(wishService.getWishlist).not.toHaveBeenCalled();
    });

    it('tab "Wensenlijst": open, gereserveerde en ontvangen (nog niet afgesloten) wensen', async () => {
        await laad([wens('open', 'Open'), wens('gereserveerd', 'Reserved'), wens('ontvangen', 'Received'), wens('vervuld', 'Fulfilled')]);
        expect(component.wishlistFilter()).toEqual(['Open', 'Received', 'Reserved']);
        expect(kaarten()).toEqual(['open', 'gereserveerd', 'ontvangen']);
    });

    it('tab "Ontvangen cadeaus": enkel de vervulde wensen (sc-1984)', async () => {
        await laad([wens('open', 'Open'), wens('vervuld', 'Fulfilled'), wens('ook vervuld', 'Fulfilled')]);
        await klikTab('Ontvangen cadeaus');
        expect(component.wishlistFilter()).toEqual(['Fulfilled']);
        expect(kaarten()).toEqual(['vervuld', 'ook vervuld']);

        await klikTab('Wensenlijst');
        expect(kaarten()).toEqual(['open']);
    });

    it('de kaart om een wens toe te voegen staat altijd vooraan, met de ontvanger', async () => {
        await laad([wens('open', 'Open')]);
        const create = fixture.debugElement.query(el => el.name === 'gimmi-wish-create-card');
        expect(create.nativeElement.receiver).toBe(ria);
    });

    it('lege lijst: melding met de voornaam van de ontvanger', async () => {
        await laad([]);
        expect(fixture.nativeElement.querySelector('ngb-alert').textContent).toContain('Vraag Ria om wensen op de lijst toe te voegen');
    });

    it('lijst met wensen: geen melding', async () => {
        await laad([wens('open', 'Open')]);
        expect(fixture.nativeElement.querySelector('ngb-alert')).toBeNull();
    });

    it('onbekende filternaam valt terug op de wensenlijst', () => {
        component.setWishlistFilter('iets anders');
        expect(component.wishlistFilter()).toEqual(['Open', 'Received', 'Reserved']);
    });
});
