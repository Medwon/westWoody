import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../../core/store/app.state';
import { selectUser } from '../../../../core/store/auth/auth.selectors';
import { User } from '../../../../core/models/user.model';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { TypographyComponent } from '../../../../shared/components/typography/typography.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { PaperComponent } from '../../../../shared/components/paper/paper.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent, TypographyComponent, CardComponent],
  template: `
    <div class="home-page">
      <app-typography variant="h1" class="welcome-title">
        Добро пожаловать, {{ (user$ | async)?.name }}!
      </app-typography>
      
      <app-typography variant="body1" [muted]="true" class="welcome-subtitle">
        Это главная страница вашего приложения.
      </app-typography>

      <div class="content-grid">
        <app-card [hoverable]="true" [shadow]="true">
          <app-typography variant="h4">Быстрые действия</app-typography>
          <app-typography variant="body2" [muted]="true" class="card-description">
            Перейдите к профилю или начните работу с приложением
          </app-typography>
          <div class="actions">
            <app-button buttonType="primary" routerLink="/profile">
              Перейти в профиль
            </app-button>
          </div>
        </app-card>

        <app-card [hoverable]="true" [shadow]="true">
          <app-typography variant="h4">Информация</app-typography>
          <app-typography variant="body2" [muted]="true" class="card-description">
            Добро пожаловать в систему управления
          </app-typography>
        </app-card>
      </div>
    </div>
  `,
  styles: [`
    .home-page {
      max-width: 1200px;
      margin: 0 auto;
    }

    .welcome-title {
      margin-bottom: 1rem;
    }

    .welcome-subtitle {
      margin-bottom: 2rem;
    }

    .content-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }

    .card-description {
      margin: 1rem 0;
    }

    .actions {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
    }
  `]
})
export class HomePageComponent implements OnInit {
  user$: Observable<User | null>;

  constructor(private store: Store<AppState>) {
    this.user$ = this.store.select(selectUser);
  }

  ngOnInit(): void {}
}

