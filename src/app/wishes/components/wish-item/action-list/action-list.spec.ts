import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionList } from './action-list';

describe('ActionList', () => {
  let component: ActionList;
  let fixture: ComponentFixture<ActionList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [ActionList],
    schemas: [NO_ERRORS_SCHEMA]
})
    .compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(ActionList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
