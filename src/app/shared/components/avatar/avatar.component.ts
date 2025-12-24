import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="avatar" [class]="getClasses()" [style.width.px]="customSize" [style.height.px]="customSize">
      <img *ngIf="src" [src]="src" [alt]="alt" />
      <span *ngIf="!src" class="avatar-text">{{ getInitials() }}</span>
    </div>
  `,
  styles: [`
    .avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background-color: #e2e8f0;
      color: #1a202c;
      font-weight: 600;
      overflow: hidden;
      flex-shrink: 0;
    }

    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-text {
      user-select: none;
    }

    .avatar.small {
      width: 32px;
      height: 32px;
      font-size: 0.75rem;
    }

    .avatar.medium {
      width: 40px;
      height: 40px;
      font-size: 0.875rem;
    }

    .avatar.large {
      width: 56px;
      height: 56px;
      font-size: 1.125rem;
    }

    .avatar.xlarge {
      width: 96px;
      height: 96px;
      font-size: 1.5rem;
    }
  `]
})
export class AvatarComponent {
  @Input() src?: string;
  @Input() alt = '';
  @Input() name = '';
  @Input() size: AvatarSize = 'medium';
  @Input() customSize?: number;

  getClasses(): string {
    return this.size;
  }

  getInitials(): string {
    if (!this.name) return '?';
    return this.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}

