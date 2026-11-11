import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocialButtons } from './social-buttons';

describe('SocialButtons', () => {
  let component: SocialButtons;
  let fixture: ComponentFixture<SocialButtons>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [SocialButtons],
    schemas: [NO_ERRORS_SCHEMA]
})
    .compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(SocialButtons);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
