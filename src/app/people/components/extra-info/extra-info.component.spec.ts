import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { ILike, Person } from '../../models/person.model';
import { PeopleService } from '../../service/people.service';
import { ExtraInfoEditComponent } from './extra-info-edit/extra-info-edit.component';
import { ExtraInfoViewComponent } from './extra-info-view/extra-info-view.component';
import { ExtraInfoComponent } from './extra-info.component';

// Extra info over een persoon: wat je graag en liever niet krijgt. Leesmodus (sc-1989) en
// bewerkmodus (sc-2375), enkel voor de persoon zelf.
describe('ExtraInfoComponent', () => {
  let fixture: ComponentFixture<ExtraInfoComponent>;
  let component: ExtraInfoComponent;
  let people: jasmine.SpyObj<PeopleService>;
  const boeken: ILike = { text: 'Boeken', url: '' };
  const thee: ILike = { text: 'Thee', url: 'https://thee.be' };
  const sokken: ILike = { text: 'Sokken', url: null };

  function toon(opties: { likes?: ILike[]; dislikes?: ILike[]; personIsUser: boolean }) {
    fixture = TestBed.createComponent(ExtraInfoComponent);
    component = fixture.componentInstance;
    component.firstName = 'Ria';
    component.likes = opties.likes;
    component.dislikes = opties.dislikes;
    component.personIsUser = opties.personIsUser;
    fixture.detectChanges();
  }

  function el(): HTMLElement { return fixture.nativeElement; }

  function potlood(): HTMLElement {
    return el().querySelector('fa-icon[ng-reflect-icon], fa-icon').parentElement;
  }

  function bewerk() {
    el().querySelector('fa-icon').dispatchEvent(new Event('click'));
    fixture.detectChanges();
  }

  function rijen(type: 'likes' | 'dislikes'): HTMLInputElement[][] {
    const edit = el().querySelectorAll('gimmi-extra-info-edit')[type === 'likes' ? 0 : 1];
    return Array.from(edit.querySelectorAll('.row')).map(r => Array.from(r.querySelectorAll('input')) as HTMLInputElement[]);
  }

  function typ(input: HTMLInputElement, waarde: string) {
    input.value = waarde;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function bewaarKnop(): HTMLButtonElement { return el().querySelector('button[type="submit"]'); }

  beforeEach(async () => {
    people = jasmine.createSpyObj<PeopleService>('PeopleService', ['updateExtraInfo']);
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [ExtraInfoComponent, ExtraInfoEditComponent, ExtraInfoViewComponent],
      providers: [
        { provide: PeopleService, useValue: people },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ personId: 'ria' }) } } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  describe('leesmodus (sc-1989)', () => {
    it('toont wat de persoon graag en liever niet krijgt, met een link waar er een url is', () => {
      toon({ likes: [boeken, thee], dislikes: [sokken], personIsUser: false });
      const views = el().querySelectorAll('gimmi-extra-info-view');
      expect(views[0].textContent).toContain('Waarmee kan je Ria een plezier doen?');
      expect(views[1].textContent).toContain('Wat krijgt Ria liever niet?');
      const links = Array.from(views[0].querySelectorAll('a')) as HTMLAnchorElement[];
      expect(links.map(a => [a.textContent, a.getAttribute('href'), a.target])).toEqual([['Thee', 'https://thee.be', '_blank']]);
      expect(views[0].querySelector('li span').textContent).toBe('Boeken');
      expect(views[1].querySelector('li').textContent.trim()).toBe('Sokken');
    });

    it('een lege lijst toont niets, ook geen kop', () => {
      toon({ likes: [boeken], dislikes: [], personIsUser: false });
      expect(el().querySelectorAll('gimmi-extra-info-view')[1].textContent.trim()).toBe('');
    });

    it('een ander ziet geen potlood en geen uitnodiging om info toe te voegen', () => {
      toon({ likes: [], dislikes: [], personIsUser: false });
      const verborgen = Array.from(el().querySelectorAll('div[hidden]')).map(d => d.textContent.trim());
      expect(verborgen).toContain('Voeg extra info over jezelf toe...');
      expect(potlood().hidden).toBeTrue();
    });

    it('de persoon zelf zonder info: uitnodiging en potlood zichtbaar', () => {
      toon({ likes: [], dislikes: [], personIsUser: true });
      const hint = Array.from(el().querySelectorAll('div')).find(d => d.textContent.trim() === 'Voeg extra info over jezelf toe...');
      expect(hint.hidden).toBeFalse();
      expect(potlood().hidden).toBeFalse();
    });

    it('de persoon zelf met info: geen uitnodiging meer', () => {
      toon({ likes: [boeken], dislikes: [], personIsUser: true });
      const hint = Array.from(el().querySelectorAll('div')).find(d => d.textContent.trim() === 'Voeg extra info over jezelf toe...');
      expect(hint.hidden).toBeTrue();
    });
  });

  describe('bewerkmodus (sc-2375)', () => {
    it('het potlood opent een formulier met de bestaande items', () => {
      toon({ likes: [boeken, thee], dislikes: [sokken], personIsUser: true });
      bewerk();
      expect(component.editMode).toBeTrue();
      expect(rijen('likes').map(r => r.map(i => i.value))).toEqual([['Boeken', ''], ['Thee', 'https://thee.be']]);
      expect(rijen('dislikes').map(r => r.map(i => i.value))).toEqual([['Sokken', '']]);
      expect(el().textContent).toContain('Waarmee kan men je een plezier doen?');
      expect(el().textContent).toContain('Wat krijgt je liever niet?');
    });

    it('een lege lijn is ongeldig: melding, geen nieuwe lijn en niet bewaren', () => {
      toon({ likes: [boeken], dislikes: [], personIsUser: true });
      bewerk();
      const plus = el().querySelectorAll('gimmi-extra-info-edit button')[0] as HTMLButtonElement;
      plus.click();
      fixture.detectChanges();
      expect(rijen('likes').length).toBe(2);
      expect(el().textContent).toContain('Beschrijving moet ingevuld worden (of verwijder lege lijn)');
      expect(plus.disabled).toBeTrue();
      expect(bewaarKnop().disabled).toBeTrue();

      typ(rijen('likes')[1][0], 'Puzzels');
      expect(plus.disabled).toBeFalse();
      expect(bewaarKnop().disabled).toBeFalse();
    });

    it('een lijn verwijderen met het vuilbakje', () => {
      toon({ likes: [boeken, thee], dislikes: [], personIsUser: true });
      bewerk();
      el().querySelector('gimmi-extra-info-edit .col-1 fa-icon').dispatchEvent(new Event('click'));
      fixture.detectChanges();
      expect(rijen('likes').map(r => r[0].value)).toEqual(['Thee']);
    });

    it('bewaren stuurt beide lijsten voor de persoon uit de url en geeft het resultaat door', () => {
      const bijgewerkt = new Person('ria', 'Ria', 'Receiver');
      bijgewerkt.extraInfo = { likes: [{ text: 'Puzzels', url: '' }], dislikes: [sokken] };
      people.updateExtraInfo.and.returnValue(of(bijgewerkt));
      toon({ likes: [boeken], dislikes: [sokken], personIsUser: true });
      const opgeslagen = jasmine.createSpy('extraInfoSaved');
      component.extraInfoSaved.subscribe(opgeslagen);
      bewerk();
      typ(rijen('likes')[0][0], 'Puzzels');
      bewaarKnop().click();
      fixture.detectChanges();

      expect(people.updateExtraInfo).toHaveBeenCalledWith('ria', [{ text: 'Puzzels', url: '' }], [{ text: 'Sokken', url: null }]);
      expect(opgeslagen).toHaveBeenCalledWith({ likes: [{ text: 'Puzzels', url: '' }], dislikes: [sokken] });
      expect(component.editMode).toBeFalse();
    });

    it('annuleren sluit het formulier zonder te bewaren; opnieuw openen begint van de bestaande items', () => {
      toon({ likes: [boeken], dislikes: [], personIsUser: true });
      bewerk();
      typ(rijen('likes')[0][0], 'Iets anders');
      el().querySelector('button[type="button"].btn-link').dispatchEvent(new Event('click'));
      fixture.detectChanges();
      expect(component.editMode).toBeFalse();
      expect(people.updateExtraInfo).not.toHaveBeenCalled();

      bewerk();
      expect(rijen('likes').map(r => r[0].value)).toEqual(['Boeken']);
    });
  });
});
