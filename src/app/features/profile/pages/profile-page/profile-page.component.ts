import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../../core/store/app.state';
import { selectUser } from '../../../../core/store/auth/auth.selectors';
import { User } from '../../../../core/models/user.model';
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
      <app-typography variant="h1" class="page-title">
        Профиль пользователя
      </app-typography>

      <app-card [shadow]="true" [bordered]="true" *ngIf="user$ | async as user">
        <div cardHeader>
          <div class="profile-header">
            <app-avatar [name]="user.name" size="large"></app-avatar>
            <div class="profile-title">
              <app-typography variant="h3">{{ user.name }}</app-typography>
              <app-badge badgeType="primary" size="medium">{{ user.role }}</app-badge>
            </div>
          </div>
        </div>

        <app-divider [spaced]="true"></app-divider>

        <div class="profile-info">
          <div class="info-item">
            <app-typography variant="body2" [medium]="true" class="info-label">Email:</app-typography>
            <app-typography variant="body1" class="info-value">{{ user.email }}</app-typography>
          </div>
          
          <app-divider></app-divider>
          
          <div class="info-item">
            <app-typography variant="body2" [medium]="true" class="info-label">Роль:</app-typography>
            <app-typography variant="body1" class="info-value">{{ user.role }}</app-typography>
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

    .page-title {
      margin-bottom: 2rem;
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

  constructor(private store: Store<AppState>) {
    this.user$ = this.store.select(selectUser);
  }

  ngOnInit(): void {}
}

