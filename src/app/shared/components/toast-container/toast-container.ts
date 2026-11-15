import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Toaster } from '../../../core/toaster';

import { CustomToast } from '../custom-toast/custom-toast';

// Zelfde plaatsing en schaduw als de vroegere ngx-toast-notifications: rechtsboven vanaf 576px,
// op een kleiner scherm onderaan over de volle breedte.
@Component({
    selector: 'gimmi-toast-container',
    template: `
    <div class="toast-overlay">
      <div class="toast-panel">
        @for (toast of toaster.toasts(); track toast) {
          <gimmi-custom-toast class="toast-card" [toast]="toast"></gimmi-custom-toast>
        }
      </div>
    </div>`,
    styles: [`
    .toast-overlay { pointer-events: none; position: fixed; z-index: 9000; left: 0; top: 0; width: 100%; height: 100%; }
    .toast-panel { width: 100%; font-size: 1rem; line-height: 1.5; }
    .toast-card { display: block; pointer-events: auto; overflow: hidden; margin-top: 1rem;
      box-shadow: rgba(0, 0, 0, .15) 0 .2rem 1.5rem .3rem; }
    @media (max-width: 575px) { .toast-overlay { display: flex; justify-content: flex-end; flex-direction: column; } .toast-panel { padding-bottom: 2px; } }
    @media (min-width: 576px) { .toast-panel { position: absolute; max-width: 20rem; top: 0; right: 1rem; } }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CustomToast]
})
export class ToastContainer {  toaster = inject(Toaster);

}
