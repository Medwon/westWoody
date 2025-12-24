import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../../core/store/app.state';
import { login } from '../../../../core/store/auth/auth.actions';
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
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CardComponent, AlertComponent, InputComponent, ButtonComponent, LinkComponent, TypographyComponent],
  template: `
    <div class="login-page">
      <app-card [shadow]="true" class="login-card">
        <div class="login-header">
          <app-typography variant="h2">Вход в систему</app-typography>
          <app-typography variant="body2" [muted]="true">
            Введите ваши учетные данные для входа
          </app-typography>
        </div>

        <app-alert
          *ngIf="error$ | async as error"
          type="error"
          [title]="'Ошибка входа'"
          [dismissible]="true"
          class="error-alert">
          {{ error }}
        </app-alert>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <app-input
            id="email"
            label="Email"
            type="email"
            placeholder="Введите email"
            formControlName="email"
            [errorMessage]="getErrorMessage('email')"
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

    .login-header app-typography:first-child {
      margin-bottom: 0.5rem;
    }

    .error-alert {
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
      color: #007bff;
      font-weight: 600;
    }
  `]
})
export class LoginPageComponent implements OnInit {
  loginForm: FormGroup;
  isLoading$: Observable<boolean>;
  error$: Observable<string | null>;

  constructor(
    private fb: FormBuilder,
    private store: Store<AppState>
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.isLoading$ = this.store.select(selectIsLoading);
    this.error$ = this.store.select(selectAuthError);
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.loginForm.valid) {
      const credentials: LoginRequest = this.loginForm.value;
      this.store.dispatch(login({ credentials }));
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return 'Это поле обязательно для заполнения';
      }
      if (control.errors['email']) {
        return 'Неверный формат email';
      }
      if (control.errors['minlength']) {
        return `Минимальная длина: ${control.errors['minlength'].requiredLength} символов`;
      }
    }
    return '';
  }
}

