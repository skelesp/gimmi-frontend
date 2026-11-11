import { Service, signal } from '@angular/core';

export type ToastType = 'success' | 'danger' | 'warning' | 'info';

export interface ToastConfig {
  text: string;
  caption: string;
  type: ToastType;
}

export class Toast implements ToastConfig {
  text: string;
  caption: string;
  type: ToastType;

  constructor(config: ToastConfig, private onClose: (toast: Toast) => void) {
    this.text = config.text;
    this.caption = config.caption;
    this.type = config.type;
  }

  close(): void {
    this.onClose(this);
  }
}

// Vervangt ngx-toast-notifications (niet meer onderhouden, past niet op Angular 16+, sc-2913).
@Service()
export class Toaster {
  static readonly duration = 4000;

  readonly toasts = signal<Toast[]>([]);

  open(config: ToastConfig): Toast {
    const toast = new Toast(config, t => this.close(t));
    this.toasts.update(toasts => [...toasts, toast]);
    setTimeout(() => toast.close(), Toaster.duration);
    return toast;
  }

  private close(toast: Toast): void {
    this.toasts.update(toasts => toasts.filter(t => t !== toast));
  }
}
