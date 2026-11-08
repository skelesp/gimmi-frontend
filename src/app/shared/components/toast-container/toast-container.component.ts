import { Component } from '@angular/core';
import { Toaster } from '../../services/toaster.service';

@Component({
  selector: 'gimmi-toast-container',
  template: `
    <div class="toast-container-top-right">
      <gimmi-custom-toast *ngFor="let toast of toaster.toasts" [toast]="toast"></gimmi-custom-toast>
    </div>`,
  styles: [`
    .toast-container-top-right { position: fixed; top: 1rem; right: 1rem; z-index: 1200; width: 350px; max-width: calc(100vw - 2rem); }
    gimmi-custom-toast { display: block; margin-bottom: .5rem; }
  `]
})
export class ToastContainerComponent {
  constructor(public toaster: Toaster) { }
}
