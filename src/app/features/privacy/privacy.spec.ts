import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Privacy } from './privacy';

describe('Privacy', () => {
  let fixture: ComponentFixture<Privacy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Privacy] }).compileComponents();
    fixture = TestBed.createComponent(Privacy);
    await fixture.whenStable();
  });

  it('shows the privacy policy with the contact address', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h1')?.textContent).toContain('Privacybeleid');
    expect(el.querySelector<HTMLAnchorElement>('a[href^="mailto:"]')?.getAttribute('href')).toBe('mailto:stijn.beeckmans@gmail.com');
  });

  it('states that no cookies are used and loads nothing from third parties', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('geen cookies');
    expect(el.querySelector('script, iframe, img')).toBeNull();
  });
});
