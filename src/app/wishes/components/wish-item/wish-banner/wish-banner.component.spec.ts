import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WishBannerComponent } from './wish-banner.component';

describe('WishBannerComponent', () => {
  let component: WishBannerComponent;
  let fixture: ComponentFixture<WishBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [WishBannerComponent]
})
    .compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(WishBannerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
