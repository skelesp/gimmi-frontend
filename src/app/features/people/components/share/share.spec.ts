import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgbConfig, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Share } from './share';

describe('Share', () => {
  let component: Share;
  let fixture: ComponentFixture<Share>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [Share],
    schemas: [NO_ERRORS_SCHEMA],
    // Without animation the popup is gone right away; otherwise it removes its elements after the test has been cleaned up.
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

  it('activate: the popup gets the link and the person', async () => {
    const ilse = { id: 'p1', firstName: 'Ilse', lastName: 'Janssens' };
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
