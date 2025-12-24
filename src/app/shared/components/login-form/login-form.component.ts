import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { InputComponent } from '../input/input.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputComponent, ButtonComponent],
  template: `
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
      <div class="form-header">
        <h2>{{ title }}</h2>
        <p *ngIf="subtitle" class="subtitle">{{ subtitle }}</p>
      </div>

      <div class="form-body">
        <app-input
          id="email"
          label="Email"
          type="email"
          placeholder="Введите email"
          formControlName="email"
          [required]="true"
          [errorMessage]="getFieldError('email')"
        ></app-input>

        <app-input
          id="password"
          label="Пароль"
          type="password"
          placeholder="Введите пароль"
          formControlName="password"
          [required]="true"
          [errorMessage]="getFieldError('password')"
        ></app-input>

        <div class="form-options" *ngIf="showRememberMe || showForgotPassword">
          <label *ngIf="showRememberMe" class="checkbox-label">
            <input type="checkbox" formControlName="rememberMe" />
            <span>{{ rememberMeLabel }}</span>
          </label>
          <a *ngIf="showForgotPassword" href="#" class="forgot-password" (click)="onForgotPassword($event)">
            {{ forgotPasswordLabel }}
          </a>
        </div>
      </div>

      <div class="form-footer">
        <app-button
          buttonType="primary"
          type="submit"
          [disabled]="loginForm.invalid || loading"
          [loading]="loading"
          [class]="'full-width'"
        >
          {{ submitLabel }}
        </app-button>

        <div *ngIf="showRegisterLink" class="register-link">
          <span>{{ registerLinkText }}</span>
          <a href="#" (click)="onRegisterClick($event)">{{ registerLinkLabel }}</a>
        </div>
      </div>
    </form>
  `,
  styles: [`
    .login-form {
      width: 100%;
      max-width: 400px;
      margin: 0 auto;
      padding: 2rem;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .form-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .form-header h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: #1a202c;
    }

    .subtitle {
      margin: 0;
      color: #64748b;
      font-size: 0.875rem;
    }

    .form-body {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      color: #64748b;
    }

    .checkbox-label input[type="checkbox"] {
      cursor: pointer;
    }

    .forgot-password {
      color: #007bff;
      text-decoration: none;
      font-weight: 500;
    }

    .forgot-password:hover {
      text-decoration: underline;
    }

    .form-footer {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    :host ::ng-deep app-button.full-width {
      width: 100%;
    }

    :host ::ng-deep app-button button {
      width: 100%;
    }

    .register-link {
      text-align: center;
      font-size: 0.875rem;
      color: #64748b;
    }

    .register-link a {
      color: #007bff;
      text-decoration: none;
      font-weight: 500;
      margin-left: 0.25rem;
    }

    .register-link a:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginFormComponent {
  @Input() title = 'Вход';
  @Input() subtitle = '';
  @Input() submitLabel = 'Войти';
  @Input() showRememberMe = true;
  @Input() rememberMeLabel = 'Запомнить меня';
  @Input() showForgotPassword = true;
  @Input() forgotPasswordLabel = 'Забыли пароль?';
  @Input() showRegisterLink = false;
  @Input() registerLinkText = 'Нет аккаунта?';
  @Input() registerLinkLabel = 'Зарегистрироваться';
  @Input() loading = false;

  @Output() submitForm = new EventEmitter<{ email: string; password: string; rememberMe: boolean }>();
  @Output() forgotPassword = new EventEmitter<void>();
  @Output() registerClick = new EventEmitter<void>();

  loginForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password, rememberMe } = this.loginForm.value;
      this.submitForm.emit({ email, password, rememberMe });
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) {
        return 'Это поле обязательно';
      }
      if (field.errors?.['email']) {
        return 'Некорректный email';
      }
      if (field.errors?.['minlength']) {
        return `Минимальная длина: ${field.errors['minlength'].requiredLength} символов`;
      }
    }
    return '';
  }

  onForgotPassword(event: Event): void {
    event.preventDefault();
    this.forgotPassword.emit();
  }

  onRegisterClick(event: Event): void {
    event.preventDefault();
    this.registerClick.emit();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}

