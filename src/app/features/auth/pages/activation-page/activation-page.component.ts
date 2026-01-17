import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastService } from '../../../../core/services/toast.service';
import { activateAccount } from '../../../../core/store/auth/auth.actions';
import { selectAuthError, selectIsLoading, selectIsAuthenticated } from '../../../../core/store/auth/auth.selectors';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AuthPromoPanelComponent } from '../../../../shared/components/auth-promo-panel/auth-promo-panel.component';
import { authMobileStyles } from '../../../../shared/styles/auth-mobile.styles';

@Component({
  selector: 'app-activation-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    AlertComponent,
    InputComponent,
    ButtonComponent,
    AuthPromoPanelComponent
  ],
  template: `
    <div class="activation-page auth-page">
      <!-- Left Promotional Panel -->
      <app-auth-promo-panel class="promo-panel-desktop"></app-auth-promo-panel>

      <!-- Right Activation Form Panel -->
      <div class="form-panel">
        <div class="form-content">
          <div class="form-header">
            <h2 class="brand-name">WestWood</h2>
            <h3 class="welcome-title">Активация аккаунта</h3>
          </div>

          <app-alert
            *ngIf="errorMessage"
            type="error"
            [title]="'Ошибка активации'"
            [dismissible]="true"
            (dismissed)="errorMessage = ''"
            class="error-alert">
            {{ errorMessage }}
          </app-alert>

          <app-alert
            *ngIf="successMessage"
            type="success"
            [title]="'Успешно'"
            [dismissible]="true"
            (dismissed)="successMessage = ''"
            class="success-alert">
            {{ successMessage }}
          </app-alert>

          <form [formGroup]="activationForm" (ngSubmit)="onSubmit()" class="activation-form auth-form">
            <app-input
              id="password"
              label="Пароль"
              type="password"
              placeholder="Введите пароль"
              formControlName="password"
              [errorMessage]="getErrorMessage('password')"
              [required]="true"
              [showPasswordToggle]="true">
            </app-input>

            <app-input
              id="confirmPassword"
              label="Подтвердите пароль"
              type="password"
              placeholder="Подтвердите пароль"
              formControlName="confirmPassword"
              [errorMessage]="getErrorMessage('confirmPassword')"
              [required]="true"
              [showPasswordToggle]="true">
            </app-input>

            <app-button
              buttonType="primary"
              type="submit"
              [disabled]="activationForm.invalid"
              [loading]="isLoading"
              class="submit-button">
              Активировать аккаунт
            </app-button>
          </form>

          <div class="form-footer">
            <span>© 2026 WestWood. Все права защищены.</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .activation-page {
      display: flex;
      min-height: 100vh;
      height: 100vh;
      background: #F5F6F8;
    }

    /* Right Form Panel */
    .form-panel {
      flex: 0 0 45%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      background: #ffffff;
    }

    .form-content {
      width: 100%;
      max-width: 360px;
      animation: slideUp 0.5s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .form-header {
      margin-bottom: 2rem;
    }

    .brand-name {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1a202c;
      margin: 0 0 0.75rem 0;
      letter-spacing: -0.02em;
    }

    .welcome-title {
      font-size: 2rem;
      font-weight: 700;
      color: #1a202c;
      margin: 0;
    }

    .error-alert,
    .success-alert {
      margin-bottom: 1.5rem;
      animation: shake 0.5s ease-out;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }

    .activation-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .submit-button {
      width: 100%;
      margin-top: 0.25rem;
    }

    :host ::ng-deep .submit-button button {
      width: 100%;
      padding: 0.875rem 1.5rem !important;
      font-size: 1rem !important;
      font-weight: 600 !important;
      border-radius: 4px !important;
      background-color: #0F0F10 !important;
      color: white !important;
      transition: all 0.2s ease !important;
    }

    ${authMobileStyles}
  `]
})
export class ActivationPageComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private store = inject(Store);
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();

  activationForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  activationToken: string | null = null;

  constructor() {
    this.activationForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Get token from query parameters
    this.activationToken = this.route.snapshot.queryParams['token'];
    
    if (!this.activationToken) {
      this.errorMessage = 'Токен активации не найден. Пожалуйста, используйте ссылку из письма.';
    }

    // Subscribe to auth state changes
    this.store.select(selectIsLoading).pipe(
      takeUntil(this.destroy$)
    ).subscribe(isLoading => {
      this.isLoading = isLoading;
    });

    this.store.select(selectAuthError).pipe(
      takeUntil(this.destroy$)
    ).subscribe(error => {
      if (error) {
        this.errorMessage = error;
        this.toastService.error(error);
      }
    });

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword && confirmPassword.errors && confirmPassword.errors['passwordMismatch'] && password && password.value === confirmPassword.value) {
      confirmPassword.setErrors(null);
    }
    
    return null;
  }

  onSubmit(): void {
    if (this.activationForm.valid && this.activationToken) {
      this.errorMessage = '';
      this.successMessage = '';
      
      const formValue = this.activationForm.value;
      const activateData = {
        token: this.activationToken,
        password: formValue.password
      };

      console.log('[ActivationPage] Activating account with token:', this.activationToken);

      // Dispatch action - effect will handle API call, state update, and navigation
      this.store.dispatch(activateAccount({ data: activateData }));
    } else if (!this.activationToken) {
      this.errorMessage = 'Токен активации не найден. Пожалуйста, используйте ссылку из письма.';
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.activationForm.get(controlName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return 'Это поле обязательно для заполнения';
      }
      if (control.errors['minlength']) {
        return `Минимальная длина: ${control.errors['minlength'].requiredLength} символов`;
      }
      if (control.errors['passwordMismatch']) {
        return 'Пароли не совпадают';
      }
    }
    return '';
  }
}
