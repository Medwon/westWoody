import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';

@Component({
  selector: 'app-step-notifications',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div class="step-content">
      <div class="info-banner">
        <span class="info-banner-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 16V12M12 9h.01"/>
          </svg>
        </span>
        <p class="info-banner-text">
          Set up automated text message marketing campaigns, or send manual ones,
          to keep your Loyalty members coming back more often.
        </p>
      </div>

      <div class="action-row">
        <app-button buttonType="primary" [disabled]="true">
          Promote this program
        </app-button>
      </div>
    </div>
  `,
  styles: [`
    .step-content { display: flex; flex-direction: column; gap: 1.25rem; }

    /* Same info banner as tiers: outlined icon, lighter blue border, premium black text */
    .info-banner {
      display: flex; align-items: flex-start; gap: 0.75rem;
      padding: 1rem 1.25rem; border-radius: 8px;
      background: #f0f9ff; border: 1px solid #bae6fd;
    }
    .info-banner-icon {
      flex-shrink: 0; width: 24px; height: 24px;
      display: flex; align-items: center; justify-content: center;
      color: #0ea5e9;
    }
    .info-banner-icon svg { width: 22px; height: 22px; }
    .info-banner-text {
      margin: 0; font-size: 0.875rem; line-height: 1.5;
      color: #0f172a; font-weight: 600;
    }

    .action-row { display: flex; }
  `]
})
export class StepNotificationsComponent {}
