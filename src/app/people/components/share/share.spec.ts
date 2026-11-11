import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgbConfig, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Person } from 'src/app/people/models/person.model';
import { Share } from './share';

describe('Share', () => {
  let component: Share;
  let fixture: ComponentFixture<Share>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [Share],
    schemas: [NO_ERRORS_SCHEMA],
    // Zonder animatie is de popup meteen weg; anders verwijdert hij zijn elementen nog nadat de test is opgeruimd.
    providers: [{ provide: NgbConfig, useFactory: () => Object.assign(new NgbConfig(), { animation: false }) }]
})
    .compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(Share);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('activate: de popup krijgt de link en de persoon', async () => {
    const ilse = new Person('p1', 'Ilse', 'Janssens');
    fixture.componentRef.setInput('personToShare', ilse);
    const open = vi.spyOn(TestBed.inject(NgbModal), 'open');

    component.activate();
    await fixture.whenStable();

    const popup = open.mock.results[0].value as NgbModalRef;
    expect(popup.componentInstance.personToShare).toBe(ilse);
    expect(popup.componentInstance.linkToShare).toContain('/people/p1');
    popup.close();
    await popup.hidden.toPromise();
  });
});
