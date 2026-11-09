import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForgotPasswordLinkComponent } from './forgot-password-link.component';

describe('ForgotPasswordLinkComponent', () => {
  let component: ForgotPasswordLinkComponent;
  let fixture: ComponentFixture<ForgotPasswordLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordLinkComponent],
      providers: [provideRouter([])],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(ForgotPasswordLinkComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
