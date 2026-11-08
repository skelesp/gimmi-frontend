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

  beforeEach(() => {
    fixture = TestBed.createComponent(WishBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
