import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnknownUserMenuComponent } from './unknown-user-menu.component';

describe('UnknownUserMenuComponent', () => {
  let component: UnknownUserMenuComponent;
  let fixture: ComponentFixture<UnknownUserMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnknownUserMenuComponent],
      providers: [provideRouter([])],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(UnknownUserMenuComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
