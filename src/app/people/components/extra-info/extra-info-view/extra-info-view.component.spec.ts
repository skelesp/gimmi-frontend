import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtraInfoViewComponent } from './extra-info-view.component';

describe('ExtraInfoViewComponent', () => {
  let component: ExtraInfoViewComponent;
  let fixture: ComponentFixture<ExtraInfoViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [ExtraInfoViewComponent]
})
    .compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(ExtraInfoViewComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
