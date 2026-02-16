import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageHeaderService } from '../../../../core/services/page-header.service';

interface WizardStep {
  num: number;
  label: string;
  hint: string;
}

const STEPS: WizardStep[] = [
  { num: 1, label: 'Program details', hint: 'Define basic information and validity for this reward program.' },
  { num: 2, label: 'Earning rules', hint: 'Configure when and how customers earn rewards.' },
  { num: 3, label: 'Rewards catalog', hint: 'Set up what customers can redeem their points or bonuses for.' },
  { num: 4, label: 'Tiers (optional)', hint: 'Optionally add tiers to differentiate customer groups.' },
  { num: 5, label: 'Notifications (optional)', hint: 'Configure messages sent to customers about this program.' },
  { num: 6, label: 'Summary', hint: 'Review all settings before activating the program.' }
];

@Component({
  selector: 'app-create-program-wizard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="wizard-wrapper">
      <div class="wizard-layout">
        <!-- ====== LEFT: Main content ====== -->
        <main class="wizard-main">
          <h2 class="step-number">{{ currentStep }}. {{ STEPS[currentStep - 1].label }}</h2>

          <!-- Step 1: Program details -->
          <div *ngIf="currentStep === 1" class="step-content">
            <form class="details-form">
              <div class="form-row">
                <label class="field">
                  <span class="field-label">Program name *</span>
                  <input class="field-input" type="text" placeholder="e.g. Weekend cashback" />
                </label>
                <label class="field field-inline-toggle">
                  <span class="field-label">Auto update</span>
                  <input type="checkbox" />
                </label>
              </div>

              <div class="form-row">
                <label class="field full-width">
                  <span class="field-label">Description</span>
                  <textarea class="field-textarea" rows="3" placeholder="Describe this reward program for your team."></textarea>
                </label>
              </div>

              <div class="helper-banner">
                <p class="helper-title">Auto update</p>
                <p class="helper-text">
                  Auto update will keep this program active and allow you to adjust rules after launch
                  without recreating the campaign.
                </p>
              </div>

              <div class="form-row two-columns">
                <label class="field">
                  <span class="field-label">Start date</span>
                  <input class="field-input" type="date" />
                </label>
                <label class="field">
                  <span class="field-label">End date</span>
                  <input class="field-input" type="date" />
                </label>
              </div>

              <div class="form-row toggles-row">
                <label class="toggle-field">
                  <input type="checkbox" />
                  <span>New customers will auto-join once any earning rule is fulfilled</span>
                </label>
                <label class="toggle-field">
                  <input type="checkbox" />
                  <span>Customers can join this campaign only once</span>
                </label>
              </div>
            </form>
          </div>

          <!-- Placeholder for steps 2-6 -->
          <div *ngIf="currentStep > 1" class="step-content">
            <p class="step-placeholder">This step will be implemented with backend.</p>
          </div>
        </main>

        <!-- ====== RIGHT: Sidebar stepper card ====== -->
        <aside class="steps-sidebar">
          <h3 class="sidebar-title">New reward program</h3>

          <ul class="steps-list">
            <li *ngFor="let step of STEPS; let last = last"
                class="step-item"
                [class.active]="currentStep === step.num"
                [class.done]="currentStep > step.num"
                [class.future]="currentStep < step.num">
              <div class="step-row">
                <span class="step-num">
                  <ng-container *ngIf="currentStep > step.num">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>
                  </ng-container>
                  <ng-container *ngIf="currentStep <= step.num">{{ step.num }}</ng-container>
                </span>
                <span class="step-label">{{ step.label }}</span>
              </div>
              <!-- Active step: hint + Next step button -->
              <div *ngIf="currentStep === step.num" class="step-active-detail">
                <p class="step-hint">{{ step.hint }}</p>
                <button type="button" class="btn-next-step" (click)="continue()" *ngIf="currentStep < STEPS.length">Next step</button>
              </div>
              <!-- Connector line -->
              <div class="step-connector" *ngIf="!last"></div>
            </li>
          </ul>

          <!-- Sidebar footer -->
          <div class="sidebar-footer">
            <a routerLink="/bonus-program" class="btn-cancel">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              Cancel
            </a>
            <button type="button" class="btn-save-draft" [class.btn-create]="currentStep === STEPS.length">
              {{ currentStep === STEPS.length ? 'Create' : 'Save draft' }}
            </button>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .wizard-wrapper { min-height: 100%; margin: -2rem; padding: 2rem; background: #f8fafc; }

    /* ===== Layout ===== */
    .wizard-layout { display: flex; gap: 1.5rem; align-items: flex-start; }

    /* ===== Main panel ===== */
    .wizard-main {
      flex: 1; min-width: 0;
      background: white; border-radius: 12px; border: 1px solid #e2e8f0;
      padding: 2rem 2.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .step-number {
      font-size: 1.25rem; font-weight: 700; color: #0f172a;
      margin: 0 0 1.5rem 0; padding-bottom: 1rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .step-content { }
    .step-placeholder { font-size: 0.9rem; color: #94a3b8; margin: 0; }

    /* ---- Program details form ---- */
    .details-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-row { display: flex; gap: 1rem; align-items: flex-start; }
    .form-row.two-columns > .field { flex: 1; }
    .form-row .full-width { flex: 1; }
    .field { display: flex; flex-direction: column; gap: 0.35rem; flex: 1; }
    .field-label { font-size: 0.8rem; font-weight: 600; color: #475569; }
    .field-input,
    .field-textarea {
      width: 100%; border-radius: 8px; border: 1px solid #cbd5e1;
      padding: 0.5rem 0.75rem; font-size: 0.9rem; color: #0f172a;
      background: #ffffff;
    }
    .field-input:focus,
    .field-textarea:focus { outline: none; border-color: #16A34A; box-shadow: 0 0 0 1px #16A34A22; }
    .field-textarea { resize: vertical; min-height: 72px; }
    .field-inline-toggle { max-width: 220px; align-self: flex-end; }

    .helper-banner {
      border-radius: 8px; border: 1px solid #fed7aa; background: #fff7ed;
      padding: 0.75rem 0.9rem; font-size: 0.8rem; color: #9a3412;
    }
    .helper-title { margin: 0 0 0.15rem 0; font-weight: 600; }
    .helper-text { margin: 0; line-height: 1.4; }

    .toggles-row { flex-direction: column; gap: 0.5rem; }
    .toggle-field { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #475569; }
    .toggle-field input { width: 16px; height: 16px; }

    /* ===== Right sidebar ===== */
    .steps-sidebar {
      flex-shrink: 0; width: 320px;
      background: white; border-radius: 12px; border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      padding: 1.75rem; display: flex; flex-direction: column;
    }
    .sidebar-title {
      font-size: 1.1rem; font-weight: 700; color: #0f172a;
      margin: 0 0 1.5rem 0; padding-bottom: 1.1rem;
      border-bottom: 1px solid #e2e8f0;
    }

    /* ---- Steps list ---- */
    .steps-list { list-style: none; padding: 0; margin: 0; flex: 1; }
    .step-item { position: relative; }
    .step-row { display: flex; align-items: center; gap: 0.85rem; }
    .step-num {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.875rem; font-weight: 700; flex-shrink: 0;
      background: #f1f5f9; color: #94a3b8;
      transition: all 0.2s;
    }
    .step-num svg { width: 16px; height: 16px; }
    .step-item.active .step-num { background: #16A34A; color: white; }
    .step-item.done .step-num { background: #dcfce7; color: #16A34A; }
    .step-label { font-size: 0.95rem; color: #94a3b8; font-weight: 500; }
    .step-item.active .step-label { color: #0f172a; font-weight: 600; }
    .step-item.done .step-label { color: #64748b; }

    /* Active step detail */
    .step-active-detail {
      margin-left: calc(36px + 0.85rem);
      padding: 0.5rem 0 0.25rem 0;
    }
    .step-hint {
      font-size: 0.85rem; color: #64748b; line-height: 1.45;
      margin: 0 0 0.85rem 0;
    }
    .btn-next-step {
      display: inline-block; padding: 0.5rem 1.25rem;
      background: #0f172a; color: white; border: none; border-radius: 6px;
      font-size: 0.85rem; font-weight: 600; cursor: pointer;
      transition: background 0.15s;
    }
    .btn-next-step:hover { background: #1e293b; }

    /* Connector line */
    .step-connector {
      width: 2px; height: 20px;
      background: #e2e8f0; margin: 4px 0 4px 17px;
      border-radius: 1px;
    }
    .step-item.done .step-connector { background: #bbf7d0; }

    /* ---- Sidebar footer ---- */
    .sidebar-footer {
      display: flex; align-items: center; justify-content: space-between;
      gap: 0.75rem; margin-top: 1.5rem; padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }
    .btn-cancel {
      display: inline-flex; align-items: center; gap: 0.4rem;
      font-size: 0.85rem; font-weight: 600; color: #ef4444;
      text-decoration: none; cursor: pointer; background: none; border: none;
      transition: color 0.15s;
    }
    .btn-cancel:hover { color: #dc2626; }
    .btn-cancel svg { width: 15px; height: 15px; }
    .btn-save-draft {
      padding: 0.5rem 1.25rem; border: 1px solid #e2e8f0; border-radius: 6px;
      background: white; color: #0f172a; font-size: 0.85rem; font-weight: 600;
      cursor: pointer; transition: all 0.15s;
    }
    .btn-save-draft:hover { background: #f8fafc; border-color: #cbd5e1; }
    .btn-save-draft.btn-create {
      background: #16A34A; color: white; border-color: #16A34A;
    }
    .btn-save-draft.btn-create:hover { background: #15803d; border-color: #15803d; }

    /* ===== Responsive ===== */
    @media (max-width: 768px) {
      .wizard-layout { flex-direction: column; }
      .steps-sidebar { width: 100%; order: -1; }
      .section-cards { grid-template-columns: 1fr; }
    }
  `]
})
export class CreateProgramWizardComponent implements OnInit {
  private pageHeaderService = inject(PageHeaderService);
  private route = inject(ActivatedRoute);
  readonly STEPS = STEPS;
  currentStep = 1;
  draftUuid = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.draftUuid = params.get('uuid') ?? '';
    });

    this.pageHeaderService.setPageHeader('Create Program', [
      { label: 'Главная', route: '/home' },
      { label: 'Reward Programs', route: '/bonus-program' },
      { label: 'Create Program' }
    ]);
  }

  back(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  continue(): void {
    if (this.currentStep < STEPS.length) this.currentStep++;
  }
}
