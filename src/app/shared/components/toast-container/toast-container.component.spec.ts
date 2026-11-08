import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { CustomToastComponent } from '../custom-toast/custom-toast.component';
import { Toaster } from '../../services/toaster.service';
import { ToastContainerComponent } from './toast-container.component';

describe('ToastContainerComponent', () => {
  let fixture: ComponentFixture<ToastContainerComponent>;
  let toaster: Toaster;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ToastContainerComponent, CustomToastComponent]
    }).compileComponents();
    toaster = TestBed.inject(Toaster);
    fixture = TestBed.createComponent(ToastContainerComponent);
  });

  it('toont een geopende toast en sluit hem met het kruisje', () => {
    toaster.open({ text: 'ok', caption: 'Gelukt!!', type: 'success' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.custom-toast').length).toBe(1);
    fixture.nativeElement.querySelector('button.close').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.custom-toast').length).toBe(0);
  });

  it('sluit de toast vanzelf na vier seconden', fakeAsync(() => {
    toaster.open({ text: 'ok', caption: 'Info', type: 'info' });
    expect(toaster.toasts.length).toBe(1);
    tick(Toaster.duration);
    expect(toaster.toasts.length).toBe(0);
  }));
});
