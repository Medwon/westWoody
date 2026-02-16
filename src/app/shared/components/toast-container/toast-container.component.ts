import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService, Toast } from '../../../core/services/toast.service';
import { ToastComponent } from '../toast/toast.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  template: `
    <div class="toast-container">
      <app-toast
        *ngFor="let toast of toasts; trackBy: trackByToastId"
        [message]="toast.message"
        [type]="toast.type"
        [duration]="toast.duration"
        [action]="toast.action"
        (closed)="removeToast(toast.id)">
      </app-toast>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      pointer-events: none;
    }

    .toast-container app-toast {
      pointer-events: auto;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .toast-container {
        top: 1rem;
        right: 1rem;
        left: 1rem;
        align-items: stretch;
      }

      .toast-container app-toast {
        max-width: 100%;
      }
    }
  `]
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  private toastService = inject(ToastService);
  toasts: Toast[] = [];
  private subscription?: Subscription;

  ngOnInit(): void {
    this.subscription = this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  removeToast(id: string): void {
    this.toastService.remove(id);
  }

  trackByToastId(index: number, toast: Toast): string {
    return toast.id;
  }
}
