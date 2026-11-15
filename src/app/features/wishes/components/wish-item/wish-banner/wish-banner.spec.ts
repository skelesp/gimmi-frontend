import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WishBanner } from './wish-banner';

describe('WishBanner', () => {
  let component: WishBanner;
  let fixture: ComponentFixture<WishBanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [WishBanner]
})
    .compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(WishBanner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
