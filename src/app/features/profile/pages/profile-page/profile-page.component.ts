import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../../core/store/app.state';
import { selectUser, selectUserFullName } from '../../../../core/store/auth/auth.selectors';
import { User } from '../../../../core/models/user.model';
import { PageHeaderService } from '../../../../core/services/page-header.service';
import { TypographyComponent } from '../../../../shared/components/typography/typography.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { DividerComponent } from '../../../../shared/components/divider/divider.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, TypographyComponent, CardComponent, AvatarComponent, DividerComponent, BadgeComponent],
  template: `
    <div class="profile-page">
      <app-card [shadow]="true" [bordered]="true" *ngIf="user$ | async as user">
        <div cardHeader>
          <div class="profile-header">
            <app-avatar [name]="getFullName(user)" size="large"></app-avatar>
            <div class="profile-title">
              <app-typography variant="h3">{{ getFullName(user) }}</app-typography>
              <div class="roles">
                <app-badge 
                  *ngFor="let role of user.roles" 
                  [badgeType]="getRoleBadgeType(role)" 
                  size="medium">
                  {{ getRoleLabel(role) }}
                </app-badge>
              </div>
            </div>
          </div>
        </div>

        <app-divider [spaced]="true"></app-divider>

        <div class="profile-info">
          <div class="info-item">
            <app-typography variant="body2" [medium]="true" class="info-label">Имя пользователя:</app-typography>
            <app-typography variant="body1" class="info-value">{{ user.username }}</app-typography>
          </div>
          
          <app-divider></app-divider>
          
          <div class="info-item">
            <app-typography variant="body2" [medium]="true" class="info-label">Email:</app-typography>
            <app-typography variant="body1" class="info-value">{{ user.email }}</app-typography>
          </div>
          
          <app-divider></app-divider>
          
          <div class="info-item">
            <app-typography variant="body2" [medium]="true" class="info-label">Имя:</app-typography>
            <app-typography variant="body1" class="info-value">{{ user.firstName }}</app-typography>
          </div>
          
          <app-divider></app-divider>
          
          <div class="info-item">
            <app-typography variant="body2" [medium]="true" class="info-label">Фамилия:</app-typography>
            <app-typography variant="body1" class="info-value">{{ user.lastName }}</app-typography>
          </div>
          
          <app-divider></app-divider>
          
          <div class="info-item">
            <app-typography variant="body2" [medium]="true" class="info-label">Статус:</app-typography>
            <app-badge [badgeType]="user.active ? 'success' : 'danger'" size="small">
              {{ user.active ? 'Активен' : 'Неактивен' }}
            </app-badge>
          </div>
        </div>
      </app-card>
    </div>
  `,
  styles: [`
    .profile-page {
      max-width: 800px;
      margin: 0 auto;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .profile-title {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .roles {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .profile-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
    }

    .info-label {
      color: #64748b;
    }

    .info-value {
      color: #1a202c;
    }
  `]
})
export class ProfilePageComponent implements OnInit {
  user$: Observable<User | null>;
  private pageHeaderService = inject(PageHeaderService);

  constructor(private store: Store<AppState>) {
    this.user$ = this.store.select(selectUser);
  }

  ngOnInit(): void {
    this.pageHeaderService.setPageHeader('Профиль', [
      { label: 'Главная', route: '/home' },
      { label: 'Профиль' }
    ]);
  }

  getFullName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'ADMIN': 'Администратор',
      'MANAGER': 'Менеджер',
      'USER': 'Пользователь'
    };
    return labels[role] || role;
  }

  getRoleBadgeType(role: string): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' {
    const types: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'> = {
      'ADMIN': 'danger',
      'MANAGER': 'primary',
      'USER': 'secondary'
    };
    return types[role] || 'secondary';
  }
}
