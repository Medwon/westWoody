import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ToastType = 'success' | 'error';

export interface ToastAction {
  label: string;
  callback: () => void;
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  action?: ToastAction;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$: Observable<Toast[]> = this.toastsSubject.asObservable();

  private defaultDuration = 3000; // 3 секунды

  show(message: string, type: ToastType = 'success', duration: number = this.defaultDuration): void {
    const toast: Toast = {
      id: this.generateId(),
      message,
      type,
      duration
    };

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, toast]);
  }

  success(message: string, duration: number = this.defaultDuration): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration: number = this.defaultDuration): void {
    this.show(message, 'error', duration);
  }

  /**
   * Show a toast with an optional action button (e.g. "Undo").
   */
  showWithAction(
    message: string,
    action: ToastAction,
    type: ToastType = 'success',
    duration: number = this.defaultDuration
  ): void {
    const toast: Toast = {
      id: this.generateId(),
      message,
      type,
      duration,
      action
    };
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, toast]);
  }

  remove(id: string): void {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter(toast => toast.id !== id));
  }

  clear(): void {
    this.toastsSubject.next([]);
  }

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
