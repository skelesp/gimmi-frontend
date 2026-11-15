import type { Mock } from "vitest";
import { NO_ERRORS_SCHEMA, Signal, SimpleChange, WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbAlertModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';

import { Wish, WishStatus } from 'src/app/features/wishes/wish';
import { FilterOnStatePipe } from '../../pipes/filter-on-state-pipe';
import { WishesData } from '../../wishes-data';
import { ApiProblem } from 'src/app/core/api/api-problem';
import { ProblemNotifier } from 'src/app/core/api/problem-notifier';
import { WishList } from './wish-list';
import { WishCreateCard } from '../wish-create-card/wish-create-card';
import { WishCard } from '../wish-item/wish-card/wish-card';
import { apiWish } from 'src/app/features/wishes/wish.testing';

// Wenslijst (sc-2300) met de tab "Ontvangen cadeaus" in plaats van een popup (sc-1984).
describe('WishList', () => {
    const ria = { id: 'ria', firstName: 'Ria', lastName: 'Receiver' };
    let fixture: ComponentFixture<WishList>;
    let component: WishList;
    let wishes: WritableSignal<Wish[]>;
    let loading: WritableSignal<boolean>;
    let listError: WritableSignal<unknown>;
    let problems: { show: Mock };
    let wishService: {
        wishes: Signal<Wish[]>;
        listLoading: Signal<boolean>;
        listError: Signal<unknown>;
        showList: Mock;
    };

    function wens(titel: string, status: WishStatus): Wish {
        return apiWish({ id: titel, title: titel, price: { amount: 1000, currency: 'EUR' }, links: [], receiver: ria, createdBy: ria, status });
    }

    async function laad(lijst: Wish[]) {
        component.receiver = ria;
        component.ngOnChanges({ receiver: new SimpleChange(null, ria, true) });
        await fixture.whenStable();
        wishes.set(lijst);
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
        loading = signal(false);
        listError = signal<unknown>(undefined);
        problems = { show: vi.fn().mockName('ProblemNotifier.show') };
        wishService = { wishes: wishes.asReadonly(), listLoading: loading.asReadonly(), listError: listError.asReadonly(), showList: vi.fn().mockName('showList') };
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
        expect(wishService.showList).toHaveBeenCalledWith('ria');
        loading.set(true);
        await fixture.whenStable();
        expect(fixture.nativeElement.querySelector('.spinner-border')).toBeTruthy();

        loading.set(false);
        await fixture.whenStable();
        expect(fixture.nativeElement.querySelector('.spinner-border')).toBeNull();
    });

    it('een fout van de server wordt gemeld (de resource verpakt hem)', async () => {
        const problem = new ApiProblem({ status: 404, code: 'not-found' as never });
        await laad([]);
        listError.set(Object.assign(new Error('Resource is currently in an error state'), { cause: problem }));
        await fixture.whenStable();
        expect(problems.show).toHaveBeenCalledWith(problem);
    });

    it('een fout die geen ApiProblem is, komt in de console', async () => {
        const consoleError = vi.spyOn(console, 'error').mockReturnValue(undefined);
        const fout = new Error('stuk');
        await laad([]);
        listError.set(fout);
        await fixture.whenStable();
        expect(problems.show).not.toHaveBeenCalled();
        expect(consoleError).toHaveBeenCalledWith(fout);
    });

    it('een ApiProblem zonder verpakking wordt ook gemeld', async () => {
        const problem = new ApiProblem({ status: 403, code: 'forbidden' as never });
        await laad([]);
        listError.set(problem);
        await fixture.whenStable();
        expect(problems.show).toHaveBeenCalledWith(problem);
    });

    it('andere wijziging dan de ontvanger: geen nieuwe ophaling', () => {
        component.ngOnChanges({ wishlistFilter: new SimpleChange(null, ['Open'], true) });
        expect(wishService.showList).not.toHaveBeenCalled();
    });

    it('tab "Wensenlijst": open, gereserveerde en ontvangen (nog niet afgesloten) wensen', async () => {
        await laad([wens('open', 'open'), wens('gereserveerd', 'reserved'), wens('ontvangen', 'received'), wens('vervuld', 'fulfilled')]);
        expect(component.wishlistFilter()).toEqual(['open', 'received', 'reserved']);
        expect(kaarten()).toEqual(['open', 'gereserveerd', 'ontvangen']);
    });

    it('tab "Ontvangen cadeaus": enkel de vervulde wensen (sc-1984)', async () => {
        await laad([wens('open', 'open'), wens('vervuld', 'fulfilled'), wens('ook vervuld', 'fulfilled')]);
        await klikTab('Ontvangen cadeaus');
        expect(component.wishlistFilter()).toEqual(['fulfilled']);
        expect(kaarten()).toEqual(['vervuld', 'ook vervuld']);

        await klikTab('Wensenlijst');
        expect(kaarten()).toEqual(['open']);
    });

    it('de kaart om een wens toe te voegen staat altijd vooraan, met de ontvanger', async () => {
        await laad([wens('open', 'open')]);
        const create = fixture.debugElement.query(el => el.name === 'gimmi-wish-create-card');
        expect(create.nativeElement.receiver).toBe(ria);
    });

    it('lege lijst: melding met de voornaam van de ontvanger', async () => {
        await laad([]);
        expect(fixture.nativeElement.querySelector('ngb-alert').textContent).toContain('Vraag Ria om wensen op de lijst toe te voegen');
    });

    it('lijst met wensen: geen melding', async () => {
        await laad([wens('open', 'open')]);
        expect(fixture.nativeElement.querySelector('ngb-alert')).toBeNull();
    });

    it('onbekende filternaam valt terug op de wensenlijst', () => {
        component.setWishlistFilter('iets anders');
        expect(component.wishlistFilter()).toEqual(['open', 'received', 'reserved']);
    });
});
