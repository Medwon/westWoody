import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent],
  template: `
    <div class="dialog-wrapper" *ngIf="visible">
      <app-modal
        [visible]="visible"
        [title]="title"
        [showCloseButton]="dismissible"
        [showFooter]="showActions"
        [size]="size"
        (closed)="onClose()">
        <div class="dialog-content">
          <p *ngIf="message">{{ message }}</p>
          <ng-content></ng-content>
        </div>
        <div modalFooter *ngIf="showActions">
          <app-button
            *ngIf="cancelLabel"
            buttonType="ghost"
            (onClick)="onCancel()">
            {{ cancelLabel }}
          </app-button>
          <app-button
            buttonType="primary"
            (onClick)="onConfirm()">
            {{ confirmLabel }}
          </app-button>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .dialog-wrapper ::ng-deep .modal-overlay {
      z-index: 10001 !important;
      background-color: rgba(0, 0, 0, 0.6) !important;
    }

    .dialog-content {
      color: #1a202c;
      line-height: 1.6;
    }

    .dialog-content p {
      margin: 0;
    }
  `]
})
export class DialogComponent {
  @Input() visible = false;
  @Input() title = '';
  @Input() message = '';
  @Input() confirmLabel = 'Подтвердить';
  @Input() cancelLabel = 'Отмена';
  @Input() showActions = true;
  @Input() dismissible = true;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
    this.onClose();
  }

  onClose(): void {
    this.visible = false;
    this.closed.emit();
  }
}

