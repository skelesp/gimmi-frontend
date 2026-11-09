
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { ILike, Person } from '../../models/person.model';
import { PeopleService } from '../../service/people.service';
import { ExtraInfoEdit } from './extra-info-edit/extra-info-edit';
import { ExtraInfoView } from './extra-info-view/extra-info-view';
import { ExtraInfo } from './extra-info';

// Extra info over een persoon: wat je graag en liever niet krijgt. Leesmodus (sc-1989) en
// bewerkmodus (sc-2375), enkel voor de persoon zelf.
describe('ExtraInfo', () => {
    let fixture: ComponentFixture<ExtraInfo>;
    let component: ExtraInfo;
    let people: Record<string, any>;
    const boeken: ILike = { text: 'Boeken', url: '' };
    const thee: ILike = { text: 'Thee', url: 'https://thee.be' };
    const sokken: ILike = { text: 'Sokken', url: null };

    async function toon(opties: {
        likes?: ILike[];
        dislikes?: ILike[];
        personIsUser: boolean;
    }) {
        fixture = TestBed.createComponent(ExtraInfo);
        component = fixture.componentInstance;
        component.firstName = 'Ria';
        component.likes = opties.likes;
        component.dislikes = opties.dislikes;
        component.personIsUser = opties.personIsUser;
        await fixture.whenStable();
    }

    function el(): HTMLElement { return fixture.nativeElement; }

    function potlood(): HTMLElement {
        return el().querySelector('fa-icon[ng-reflect-icon], fa-icon').parentElement;
    }

    async function bewerk() {
        el().querySelector('fa-icon').dispatchEvent(new Event('click'));
        await fixture.whenStable();
    }

    function rijen(type: 'likes' | 'dislikes'): HTMLInputElement[][] {
        const edit = el().querySelectorAll('gimmi-extra-info-edit')[type === 'likes' ? 0 : 1];
        return Array.from(edit.querySelectorAll('.row')).map(r => Array.from(r.querySelectorAll('input')) as HTMLInputElement[]);
    }

    async function typ(input: HTMLInputElement, waarde: string) {
        input.value = waarde;
        input.dispatchEvent(new Event('input'));
        await fixture.whenStable();
    }

    function bewaarKnop(): HTMLButtonElement { return el().querySelector('button[type="submit"]'); }

    beforeEach(async () => {
        people = {
            updateExtraInfo: vi.fn().mockName("PeopleService.updateExtraInfo")
        };
        await TestBed.configureTestingModule({
    imports: [ReactiveFormsModule, ExtraInfo, ExtraInfoEdit, ExtraInfoView],
    providers: [
        { provide: PeopleService, useValue: people },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ personId: 'ria' }) } } }
    ],
    schemas: [NO_ERRORS_SCHEMA]
}).compileComponents();
    });

    describe('leesmodus (sc-1989)', () => {
        it('toont wat de persoon graag en liever niet krijgt, met een link waar er een url is', async () => {
            await toon({ likes: [boeken, thee], dislikes: [sokken], personIsUser: false });
            const views = el().querySelectorAll('gimmi-extra-info-view');
            expect(views[0].textContent).toContain('Waarmee kan je Ria een plezier doen?');
            expect(views[1].textContent).toContain('Wat krijgt Ria liever niet?');
            const links = Array.from(views[0].querySelectorAll('a')) as HTMLAnchorElement[];
            expect(links.map(a => [a.textContent, a.getAttribute('href'), a.target])).toEqual([['Thee', 'https://thee.be', '_blank']]);
            expect(views[0].querySelector('li span').textContent).toBe('Boeken');
            expect(views[1].querySelector('li').textContent.trim()).toBe('Sokken');
        });

        it('een lege lijst toont niets, ook geen kop', async () => {
            await toon({ likes: [boeken], dislikes: [], personIsUser: false });
            expect(el().querySelectorAll('gimmi-extra-info-view')[1].textContent.trim()).toBe('');
        });

        it('een ander ziet geen potlood en geen uitnodiging om info toe te voegen', async () => {
            await toon({ likes: [], dislikes: [], personIsUser: false });
            const verborgen = Array.from(el().querySelectorAll('div[hidden]')).map(d => d.textContent.trim());
            expect(verborgen).toContain('Voeg extra info over jezelf toe...');
            expect(potlood().hidden).toBe(true);
        });

        it('de persoon zelf zonder info: uitnodiging en potlood zichtbaar', async () => {
            await toon({ likes: [], dislikes: [], personIsUser: true });
            const hint = Array.from(el().querySelectorAll('div')).find(d => d.textContent.trim() === 'Voeg extra info over jezelf toe...');
            expect(hint.hidden).toBe(false);
            expect(potlood().hidden).toBe(false);
        });

        it('de persoon zelf met info: geen uitnodiging meer', async () => {
            await toon({ likes: [boeken], dislikes: [], personIsUser: true });
            const hint = Array.from(el().querySelectorAll('div')).find(d => d.textContent.trim() === 'Voeg extra info over jezelf toe...');
            expect(hint.hidden).toBe(true);
        });
    });

    describe('bewerkmodus (sc-2375)', () => {
        it('het potlood opent een formulier met de bestaande items', async () => {
            await toon({ likes: [boeken, thee], dislikes: [sokken], personIsUser: true });
            await bewerk();
            expect(component.editMode).toBe(true);
            expect(rijen('likes').map(r => r.map(i => i.value))).toEqual([['Boeken', ''], ['Thee', 'https://thee.be']]);
            expect(rijen('dislikes').map(r => r.map(i => i.value))).toEqual([['Sokken', '']]);
            expect(el().textContent).toContain('Waarmee kan men je een plezier doen?');
            expect(el().textContent).toContain('Wat krijgt je liever niet?');
        });

        it('een lege lijn is ongeldig: melding, geen nieuwe lijn en niet bewaren', async () => {
            await toon({ likes: [boeken], dislikes: [], personIsUser: true });
            await bewerk();
            const plus = el().querySelectorAll('gimmi-extra-info-edit button')[0] as HTMLButtonElement;
            plus.click();
            await fixture.whenStable();
            expect(rijen('likes').length).toBe(2);
            expect(el().textContent).toContain('Beschrijving moet ingevuld worden (of verwijder lege lijn)');
            expect(plus.disabled).toBe(true);
            expect(bewaarKnop().disabled).toBe(true);

            await typ(rijen('likes')[1][0], 'Puzzels');
            expect(plus.disabled).toBe(false);
            expect(bewaarKnop().disabled).toBe(false);
        });

        it('een lijn verwijderen met het vuilbakje', async () => {
            await toon({ likes: [boeken, thee], dislikes: [], personIsUser: true });
            await bewerk();
            el().querySelector('gimmi-extra-info-edit .col-1 fa-icon').dispatchEvent(new Event('click'));
            await fixture.whenStable();
            expect(rijen('likes').map(r => r[0].value)).toEqual(['Thee']);
        });

        it('bewaren stuurt beide lijsten voor de persoon uit de url en geeft het resultaat door', async () => {
            const bijgewerkt = new Person('ria', 'Ria', 'Receiver');
            bijgewerkt.extraInfo = { likes: [{ text: 'Puzzels', url: '' }], dislikes: [sokken] };
            people.updateExtraInfo.mockReturnValue(of(bijgewerkt));
            await toon({ likes: [boeken], dislikes: [sokken], personIsUser: true });
            const opgeslagen = vi.fn().mockName('extraInfoSaved');
            component.extraInfoSaved.subscribe(opgeslagen);
            await bewerk();
            await typ(rijen('likes')[0][0], 'Puzzels');
            bewaarKnop().click();
            await fixture.whenStable();

            expect(people.updateExtraInfo).toHaveBeenCalledWith('ria', [{ text: 'Puzzels', url: '' }], [{ text: 'Sokken', url: null }]);
            expect(opgeslagen).toHaveBeenCalledWith({ likes: [{ text: 'Puzzels', url: '' }], dislikes: [sokken] });
            expect(component.editMode).toBe(false);
        });

        it('annuleren sluit het formulier zonder te bewaren; opnieuw openen begint van de bestaande items', async () => {
            await toon({ likes: [boeken], dislikes: [], personIsUser: true });
            await bewerk();
            await typ(rijen('likes')[0][0], 'Iets anders');
            el().querySelector('button[type="button"].btn-link').dispatchEvent(new Event('click'));
            await fixture.whenStable();
            expect(component.editMode).toBe(false);
            expect(people.updateExtraInfo).not.toHaveBeenCalled();

            await bewerk();
            expect(rijen('likes').map(r => r[0].value)).toEqual(['Boeken']);
        });
    });
});
