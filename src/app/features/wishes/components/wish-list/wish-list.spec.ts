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

// Wish list (sc-2300) with the "Ontvangen cadeaus" tab instead of a popup (sc-1984).
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

    function wish(title: string, status: WishStatus): Wish {
        return apiWish({ id: title, title: title, price: { amount: 1000, currency: 'EUR' }, links: [], receiver: ria, createdBy: ria, status });
    }

    async function load(list: Wish[]) {
        component.receiver = ria;
        component.ngOnChanges({ receiver: new SimpleChange(null, ria, true) });
        await fixture.whenStable();
        wishes.set(list);
        await fixture.whenStable();
    }

    function cards(): string[] {
        return fixture.debugElement.queryAll(el => el.name === 'gimmi-wish-card').map(el => el.nativeElement.wish.title);
    }

    async function clickTab(text: string) {
        const tab: HTMLElement = Array.from(fixture.nativeElement.querySelectorAll('.nav-tabs button') as NodeListOf<HTMLElement>)
            .find(a => a.textContent.trim() === text);
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

    it('fetches the list for a new recipient and shows a spinner meanwhile', async () => {
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

    it('an error from the server is reported (the resource wraps it)', async () => {
        const problem = new ApiProblem({ status: 404, code: 'not-found' as never });
        await load([]);
        listError.set(Object.assign(new Error('Resource is currently in an error state'), { cause: problem }));
        await fixture.whenStable();
        expect(problems.show).toHaveBeenCalledWith(problem);
    });

    it('an error that is not an ApiProblem goes to the console', async () => {
        const consoleError = vi.spyOn(console, 'error').mockReturnValue(undefined);
        const error = new Error('stuk');
        await load([]);
        listError.set(error);
        await fixture.whenStable();
        expect(problems.show).not.toHaveBeenCalled();
        expect(consoleError).toHaveBeenCalledWith(error);
    });

    it('an ApiProblem without wrapping is also reported', async () => {
        const problem = new ApiProblem({ status: 403, code: 'forbidden' as never });
        await load([]);
        listError.set(problem);
        await fixture.whenStable();
        expect(problems.show).toHaveBeenCalledWith(problem);
    });

    it('change other than the recipient: no new fetch', () => {
        component.ngOnChanges({ wishlistFilter: new SimpleChange(null, ['Open'], true) });
        expect(wishService.showList).not.toHaveBeenCalled();
    });

    it('tab "Wensenlijst": open, reserved and received (not yet closed) wishes', async () => {
        await load([wish('open', 'open'), wish('gereserveerd', 'reserved'), wish('ontvangen', 'received'), wish('vervuld', 'fulfilled')]);
        expect(component.wishlistFilter()).toEqual(['open', 'received', 'reserved']);
        expect(cards()).toEqual(['open', 'gereserveerd', 'ontvangen']);
    });

    it('tab "Ontvangen cadeaus": only the fulfilled wishes (sc-1984)', async () => {
        await load([wish('open', 'open'), wish('vervuld', 'fulfilled'), wish('ook vervuld', 'fulfilled')]);
        await clickTab('Ontvangen cadeaus');
        expect(component.wishlistFilter()).toEqual(['fulfilled']);
        expect(cards()).toEqual(['vervuld', 'ook vervuld']);

        await clickTab('Wensenlijst');
        expect(cards()).toEqual(['open']);
    });

    it('the card to add a wish is always at the front, with the recipient', async () => {
        await load([wish('open', 'open')]);
        const create = fixture.debugElement.query(el => el.name === 'gimmi-wish-create-card');
        expect(create.nativeElement.receiver).toBe(ria);
    });

    it('empty list: notice with the first name of the recipient', async () => {
        await load([]);
        expect(fixture.nativeElement.querySelector('ngb-alert').textContent).toContain('Vraag Ria om wensen op de lijst toe te voegen');
    });

    it('list with wishes: no notice', async () => {
        await load([wish('open', 'open')]);
        expect(fixture.nativeElement.querySelector('ngb-alert')).toBeNull();
    });

    it('unknown filter name falls back to the wish list', () => {
        component.setWishlistFilter('iets anders');
        expect(component.wishlistFilter()).toEqual(['open', 'received', 'reserved']);
    });
});
