import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppState } from '../../../../core/store/app.state';
import { login, clearError } from '../../../../core/store/auth/auth.actions';
import { selectIsLoading, selectAuthError } from '../../../../core/store/auth/auth.selectors';
import { LoginRequest } from '../../../../core/models/user.model';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { LinkComponent } from '../../../../shared/components/link/link.component';
import { TypographyComponent } from '../../../../shared/components/typography/typography.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterModule, 
    CardComponent, 
    AlertComponent, 
    InputComponent, 
    ButtonComponent, 
    LinkComponent, 
    TypographyComponent
  ],
  template: `
    <div class="login-page">
      <app-card [shadow]="true" class="login-card">
        <div class="login-header">
          <div class="logo">
            <svg viewBox="0 0 24 24" fill="none" class="logo-icon">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.8"/>
              <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="logo-text">WestWood</span>
          </div>
          <app-typography variant="h2">Вход в систему</app-typography>
          <app-typography variant="body2" [muted]="true">
            Введите ваши учетные данные для входа
          </app-typography>
        </div>

        <!-- Success messages from registration or activation -->
        <app-alert
          *ngIf="successMessage"
          type="success"
          [title]="'Успешно'"
          [dismissible]="true"
          (dismissed)="successMessage = ''"
          class="success-alert">
          {{ successMessage }}
        </app-alert>

        <!-- Session expired message -->
        <app-alert
          *ngIf="sessionExpired"
          type="warning"
          [title]="'Сессия истекла'"
          [dismissible]="true"
          (dismissed)="sessionExpired = false"
          class="warning-alert">
          Ваша сессия истекла. Пожалуйста, войдите снова.
        </app-alert>

        <app-alert
          *ngIf="error$ | async as error"
          type="error"
          [title]="'Ошибка входа'"
          [dismissible]="true"
          (dismissed)="onClearError()"
          class="error-alert">
          {{ error }}
        </app-alert>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <app-input
            id="username"
            label="Имя пользователя"
            type="text"
            placeholder="Введите имя пользователя"
            formControlName="username"
            [errorMessage]="getErrorMessage('username')"
            [required]="true">
          </app-input>

          <app-input
            id="password"
            label="Пароль"
            type="password"
            placeholder="Введите пароль"
            formControlName="password"
            [errorMessage]="getErrorMessage('password')"
            [required]="true">
          </app-input>

          <app-button
            buttonType="primary"
            type="submit"
            [disabled]="loginForm.invalid"
            [loading]="(isLoading$ | async) ?? false"
            class="submit-button">
            Войти
          </app-button>

          <div class="login-footer">
            <app-link routerLink="/auth/register">
              <app-typography variant="body2" [muted]="true">
                Нет аккаунта? <strong>Зарегистрироваться</strong>
              </app-typography>
            </app-link>
          </div>
        </form>
      </app-card>
    </div>
  `,
  styles: [`
    .login-page {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #15803d 0%, #166534 100%);
      padding: 2rem;
    }

    .login-card {
      width: 100%;
      max-width: 450px;
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      color: #15803d;
    }

    .logo-text {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a202c;
      letter-spacing: -0.02em;
    }

    .login-header app-typography:first-of-type {
      margin-bottom: 0.5rem;
    }

    .success-alert, .warning-alert, .error-alert {
      margin-bottom: 1.5rem;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .submit-button {
      width: 100%;
      margin-top: 0.5rem;
    }

    .login-footer {
      text-align: center;
      margin-top: 1rem;
    }

    :host ::ng-deep .submit-button button {
      width: 100%;
    }

    :host ::ng-deep .login-footer strong {
      color: #15803d;
      font-weight: 600;
    }
  `]
})
export class LoginPageComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  isLoading$: Observable<boolean>;
  error$: Observable<string | null>;
  successMessage = '';
  sessionExpired = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private store: Store<AppState>,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.isLoading$ = this.store.select(selectIsLoading);
    this.error$ = this.store.select(selectAuthError);
  }

  ngOnInit(): void {
    // Check for query params
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['registered']) {
        this.successMessage = 'Регистрация прошла успешно! Проверьте вашу почту для активации аккаунта.';
      }
      if (params['activated']) {
        this.successMessage = 'Аккаунт успешно активирован! Теперь вы можете войти.';
      }
      if (params['sessionExpired'] || params['expired']) {
        this.sessionExpired = true;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const credentials: LoginRequest = this.loginForm.value;
      this.store.dispatch(login({ credentials }));
    }
  }

  onClearError(): void {
    this.store.dispatch(clearError());
  }

  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return 'Это поле обязательно для заполнения';
      }
      if (control.errors['minlength']) {
        return `Минимальная длина: ${control.errors['minlength'].requiredLength} символов`;
      }
    }
    return '';
  }
}
