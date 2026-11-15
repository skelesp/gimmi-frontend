import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtraInfoView } from './extra-info-view';

describe('ExtraInfoView', () => {
  let component: ExtraInfoView;
  let fixture: ComponentFixture<ExtraInfoView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [ExtraInfoView]
})
    .compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(ExtraInfoView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
