import { Component } from '@angular/core';
import { Toaster } from '../../services/toaster.service';

// Zelfde plaatsing en schaduw als de vroegere ngx-toast-notifications: rechtsboven vanaf 576px,
// op een kleiner scherm onderaan over de volle breedte.
@Component({
  selector: 'gimmi-toast-container',
  template: `
    <div class="toast-overlay">
      <div class="toast-panel">
        <gimmi-custom-toast *ngFor="let toast of toaster.toasts" class="toast-card" [toast]="toast"></gimmi-custom-toast>
      </div>
    </div>`,
  styles: [`
    .toast-overlay { pointer-events: none; position: fixed; z-index: 9000; left: 0; top: 0; width: 100%; height: 100%; }
    .toast-panel { width: 100%; font-size: 1rem; line-height: 1.5; }
    .toast-card { display: block; pointer-events: auto; overflow: hidden; margin-top: 1rem;
      box-shadow: rgba(0, 0, 0, .15) 0 .2rem 1.5rem .3rem; }
    @media (max-width: 575px) { .toast-overlay { display: flex; justify-content: flex-end; flex-direction: column; } }
    @media (min-width: 576px) { .toast-panel { position: absolute; max-width: 20rem; top: 0; right: 1rem; } }
  `]
})
export class ToastContainerComponent {
  constructor(public toaster: Toaster) { }
}
