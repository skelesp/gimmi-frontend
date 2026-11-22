import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { TitleStrategy, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { environment } from 'src/environments/environment';
import { PageTitleStrategy } from './page-title-strategy';

@Component({ template: '' })
class DummyComponent { }

// sc-2688: every route has its own tab title, behind the title of the environment.
describe('PageTitleStrategy', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'login', title: 'Inloggen', component: DummyComponent },
          { path: 'untitled', component: DummyComponent }
        ]),
        { provide: TitleStrategy, useClass: PageTitleStrategy }
      ]
    });
  });

  it('puts the route title behind the environment title', async () => {
    await RouterTestingHarness.create('/login');
    expect(TestBed.inject(Title).getTitle()).toBe(`${environment.title} | Inloggen`);
  });

  it('shows only the environment title for a route without title', async () => {
    await RouterTestingHarness.create('/untitled');
    expect(TestBed.inject(Title).getTitle()).toBe(environment.title);
  });
});
