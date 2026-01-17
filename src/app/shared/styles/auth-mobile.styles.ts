/**
 * Общие мобильные стили для всех auth страниц
 * Применяется к: login, register, forgot-password, reset-password, activation
 */
export const authMobileStyles = `
  /* Desktop - Hide form footer (footer is in promo panel) */
  .form-footer {
    display: none;
  }

  /* Tablet Responsive (1024px) */
  @media (max-width: 1024px) {
    .auth-page {
      flex-direction: column;
      min-height: 100vh;
      height: auto;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%);
      position: relative;
      overflow-x: hidden;
      overflow-y: auto;
    }

    .auth-page::before {
      content: '';
      position: absolute;
      width: 200%;
      height: 200%;
      top: -50%;
      left: -50%;
      background: radial-gradient(circle at 20% 30%, rgba(22, 163, 74, 0.08) 0%, transparent 50%),
                  radial-gradient(circle at 80% 70%, rgba(15, 15, 16, 0.06) 0%, transparent 50%);
      animation: float 20s ease-in-out infinite;
      z-index: 0;
      pointer-events: none;
    }

    @keyframes float {
      0%, 100% {
        transform: translate(0, 0) rotate(0deg);
      }
      33% {
        transform: translate(30px, -30px) rotate(120deg);
      }
      66% {
        transform: translate(-20px, 20px) rotate(240deg);
      }
    }

    .promo-panel-desktop {
      display: block;
    }

    .form-panel {
      flex: 1;
      padding: 2.5rem 2rem 3rem;
      margin-top: -50px;
      position: relative;
      z-index: 3;
      background: #ffffff;
      box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.12);
      border-top-left-radius: 30px;
      border-top-right-radius: 30px;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      min-height: auto;
    }

    .form-content {
      max-width: 480px;
      margin: 0 auto;
      animation: slideUpMobile 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      z-index: 2;
    }

    @keyframes slideUpMobile {
      from {
        opacity: 0;
        transform: translateY(40px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .form-header {
      text-align: center;
      margin-bottom: 2rem;
      position: relative;
    }

    .brand-name {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #16A34A 0%, #15803d 50%, #0F0F10 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.03em;
    }

    .welcome-title {
      font-size: 1.75rem;
      margin-bottom: 1rem;
      color: #1a202c;
      font-weight: 700;
    }

    .register-prompt,
    .login-prompt,
    .back-to-login-prompt {
      font-size: 0.9375rem;
      margin-top: 0.5rem;
    }

    .auth-form,
    .login-form,
    .register-form,
    .activation-form,
    .reset-password-form,
    .forgot-password-form {
      gap: 1.25rem;
      margin-top: 1rem;
    }

    .submit-button {
      margin-top: 0.5rem;
    }

    :host ::ng-deep .submit-button button {
      box-shadow: 0 4px 12px rgba(15, 15, 16, 0.2);
      transform: translateY(0);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    :host ::ng-deep .submit-button button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(15, 15, 16, 0.3);
    }

    :host ::ng-deep .submit-button button:active {
      transform: translateY(0);
    }

    .forgot-password-link {
      margin-top: 0.75rem;
    }

    .warning-alert,
    .error-alert,
    .success-alert {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

  }

  /* Mobile Responsive (640px) */
  @media (max-width: 640px) {
    .auth-page {
      flex-direction: column;
      min-height: 100vh;
      height: auto;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%);
      position: relative;
      overflow-x: hidden;
    }

    .auth-page::before {
      content: '';
      position: absolute;
      width: 200%;
      height: 200%;
      top: -50%;
      left: -50%;
      background: radial-gradient(circle at 20% 30%, rgba(22, 163, 74, 0.08) 0%, transparent 50%),
                  radial-gradient(circle at 80% 70%, rgba(15, 15, 16, 0.06) 0%, transparent 50%);
      animation: float 20s ease-in-out infinite;
      z-index: 0;
      pointer-events: none;
    }

    @keyframes float {
      0%, 100% {
        transform: translate(0, 0) rotate(0deg);
      }
      33% {
        transform: translate(30px, -30px) rotate(120deg);
      }
      66% {
        transform: translate(-20px, 20px) rotate(240deg);
      }
    }

    .promo-panel-desktop {
      display: block;
    }

    .form-panel {
      flex: 1;
      padding: 2rem 1.5rem 3rem;
      margin-top: -40px;
      position: relative;
      z-index: 3;
      background: #ffffff;
      box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.12);
      border-top-left-radius: 30px;
      border-top-right-radius: 30px;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      min-height: auto;
    }

    .form-content {
      max-width: 100%;
      animation: slideUpMobile 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      z-index: 2;
    }

    @keyframes slideUpMobile {
      from {
        opacity: 0;
        transform: translateY(40px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .form-header {
      text-align: center;
      margin-bottom: 2rem;
      position: relative;
    }

    .brand-name {
      font-size: 1.875rem;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #16A34A 0%, #15803d 50%, #0F0F10 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.03em;
    }

    .welcome-title {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: #1a202c;
      font-weight: 700;
    }

    .register-prompt,
    .login-prompt,
    .back-to-login-prompt {
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .auth-form,
    .login-form,
    .register-form,
    .activation-form,
    .reset-password-form,
    .forgot-password-form {
      gap: 1.25rem;
      margin-top: 1rem;
    }

    .submit-button {
      margin-top: 0.5rem;
    }

    :host ::ng-deep .submit-button button {
      box-shadow: 0 4px 12px rgba(15, 15, 16, 0.2);
      transform: translateY(0);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    :host ::ng-deep .submit-button button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(15, 15, 16, 0.3);
    }

    :host ::ng-deep .submit-button button:active {
      transform: translateY(0);
    }

    .forgot-password-link {
      margin-top: 0.75rem;
    }

    .warning-alert,
    .error-alert,
    .success-alert {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .form-footer {
      margin-top: 2rem;
      text-align: center;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(0, 0, 0, 0.05);
    }

    .form-footer span {
      font-size: 0.75rem;
      color: #64748b;
      opacity: 0.8;
    }
  }

  /* Small Mobile (480px) */
  @media (max-width: 480px) {
    .form-panel {
      padding: 1.5rem 1.25rem;
      border-top-left-radius: 20px;
      border-top-right-radius: 20px;
    }

    .brand-name {
      font-size: 1.625rem;
    }

    .welcome-title {
      font-size: 1.375rem;
    }

    .form-header {
      margin-bottom: 1.5rem;
    }

    .auth-form,
    .login-form,
    .register-form,
    .activation-form,
    .reset-password-form,
    .forgot-password-form {
      gap: 1rem;
    }
  }
`;
