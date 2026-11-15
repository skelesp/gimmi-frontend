import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnknownUserMenu } from './unknown-user-menu';

describe('UnknownUserMenu', () => {
  let component: UnknownUserMenu;
  let fixture: ComponentFixture<UnknownUserMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnknownUserMenu],
      providers: [provideRouter([])],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(UnknownUserMenu);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
