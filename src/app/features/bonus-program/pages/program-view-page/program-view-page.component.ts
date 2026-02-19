import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RewardProgramsService } from '../../../../core/services/reward-programs.service';
import { PageHeaderService } from '../../../../core/services/page-header.service';
import { DialogComponent } from '../../../../shared/components/dialog/dialog.component';
import {
  RewardProgramResponse,
  RewardProgramType,
  RewardProgramStatus,
  CashbackType,
  EligibilityType,
  DayOfWeek,
  CashbackTierResponse,
  CashbackProgramRuleResponse,
  WeeklyScheduleResponse,
} from '../../../../core/models/reward-program.model';

const DAY_ORDER: Record<string, number> = {
  MONDAY: 0, TUESDAY: 1, WEDNESDAY: 2, THURSDAY: 3, FRIDAY: 4, SATURDAY: 5, SUNDAY: 6
};

/** Client in a tier (from tiered-clients API) */
export interface TierClientPlaceholder {
  clientUuid: string;
  name: string;
  phone?: string;
  totalSpend: number;
}

/** Grouped schedule line: "Mon – Fri: 08:00 – 18:00" or "Sat: Off" */
export interface ScheduleGroup {
  label: string;
  time: string;
  enabled: boolean;
}

type Tab = 'overview' | 'tiers' | 'schedule';

type ConfirmAction = 'deactivate' | 'archive' | 'launchNow';

@Component({
  selector: 'app-program-view-page',
  standalone: true,
  imports: [CommonModule, RouterModule, DialogComponent],
  template: `
    @if (loading) {
      <div class="page-shell">
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading program...</p>
        </div>
      </div>
    }

    @if (!loading && error) {
      <div class="page-shell">
        <div class="error-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="error-icon">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
          </svg>
          <p>{{ error }}</p>
          <button class="btn-retry" (click)="loadProgram()">Retry</button>
        </div>
      </div>
    }

    @if (!loading && !error && program) {
      <div class="page-shell">
        <!-- Program Summary (contextual header) -->
        <header class="program-summary">
          <div class="summary-left">
            <h1 class="summary-title">{{ program.name || 'Untitled Program' }}</h1>
            <span class="summary-badge status" [attr.data-status]="program.status">
              <span class="summary-badge-icon" aria-hidden="true">
                @switch (program.status) {
                  @case ('ACTIVE') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
                  }
                  @case ('SCHEDULED') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  }
                  @case ('DRAFT') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  }
                  @case ('ARCHIVED') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>
                  }
                  @case ('INACTIVE') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M10 15V9"/><path d="M14 15V9"/></svg>
                  }
                  @default {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
                  }
                }
              </span>
              <span class="summary-badge-text">{{ statusLabel(program.status) }}</span>
            </span>
          </div>
          <div class="summary-actions">
            <button type="button" class="btn-action btn-secondary" (click)="onAdjustProgram()">Adjust Program</button>
            @if (program.status === 'ACTIVE') {
              <button type="button" class="btn-action btn-outline-danger" (click)="confirmAction = 'deactivate'">Deactivate</button>
            }
            @if (program.status === 'SCHEDULED') {
              <button type="button" class="btn-action btn-primary" (click)="confirmAction = 'launchNow'">Launch Now</button>
            }
            @if (program.status === 'INACTIVE') {
              <button type="button" class="btn-action btn-outline" (click)="confirmAction = 'archive'">Archive</button>
            }
          </div>
        </header>

        <!-- Tabs (routable) -->
        <div class="tabs-bar" role="tablist">
          <a [routerLink]="['/bonus-program/view', viewUuid, 'overview']" class="tab-item" role="tab" [attr.aria-selected]="activeTab === 'overview'">Overview</a>
          <a [routerLink]="['/bonus-program/view', viewUuid, 'tiers']" class="tab-item" role="tab" [attr.aria-selected]="activeTab === 'tiers'">Tiers</a>
          <a [routerLink]="['/bonus-program/view', viewUuid, 'schedule']" class="tab-item" role="tab" [attr.aria-selected]="activeTab === 'schedule'">Schedule</a>
        </div>

        <div class="tab-content">
          <!-- OVERVIEW (combined: Cashback at a glance, Program info, Dates, Rules) -->
          @if (activeTab === 'overview') {
            <div class="tab-cards overview-cards">
              @if (program.type === 'CASHBACK' && program.cashbackRule) {
                <section class="card card-span cashback-glance">
                  <h2 class="card-title">Cashback at a Glance</h2>
                  <div class="glance-two-views">
                    <div class="glance-view">
                      <span class="glance-view-label">Rate</span>
                      <span class="glance-view-value">{{ formatCashbackValue(program.cashbackRule) }}</span>
                    </div>
                    <div class="glance-view">
                      <span class="glance-view-label">Per spend</span>
                      <span class="glance-view-value">{{ getCashbackPerSpendText(program.cashbackRule) }}</span>
                    </div>
                  </div>
                  <div class="stats-row"> 
                    <div class="stat-block">
                      <span class="stat-value">{{ program.cashbackRule.minSpendAmount | number:'1.0-0' }} ₸</span>
                      <span class="stat-label">Min. Spend</span>
                    </div>
                    <div class="stat-block">
                      <span class="stat-value">{{ program.cashbackRule.redeemLimitPercent }}%</span>
                      <span class="stat-label">Redeem Limit</span>
                    </div>
                    @if (program.cashbackRule.bonusLifespanDays) {
                      <div class="stat-block">
                        <span class="stat-value">{{ program.cashbackRule.bonusLifespanDays }} days</span>
                        <span class="stat-label">Bonus Lifespan</span>
                      </div>
                    }
                  </div>
                </section>
              }
              <section class="card">
                <h2 class="card-title">Program Information</h2>
                <div class="info-list">
                  <div class="info-row">
                    <span class="info-label">Name</span>
                    <span class="info-value">{{ program.name || '—' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Type</span>
                    <span class="info-value">{{ typeLabel(program.type) }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Status</span>
                    <span class="info-value">
                      <span class="status-dot" [attr.data-status]="program.status"></span>
                      {{ statusLabel(program.status) }}
                    </span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Description</span>
                    <span class="info-value description-text">{{ program.description || '—' }}</span>
                  </div>
                </div>
              </section>
              <section class="card">
                <h2 class="card-title">Dates</h2>
                <div class="info-list">
                  <div class="info-row">
                    <span class="info-label">Start</span>
                    <span class="info-value">{{ formatDate(program.startDate) }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">End</span>
                    <span class="info-value">{{ formatDate(program.endDate) || 'No end date' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Created</span>
                    <span class="info-value">{{ formatDate(program.createdAt) }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Updated</span>
                    <span class="info-value">{{ formatDate(program.updatedAt) }}</span>
                  </div>
                </div>
              </section>
              <section class="card card-span rules-card">
                <h2 class="card-title">Cashback Rules</h2>
                @if (program.cashbackRule; as rule) {
                  <div class="rules-two-col">
                    <div class="rule-box earning">
                      <div class="rule-box-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 01-8 0"/></svg>
                      </div>
                      <span class="rule-box-label">Earning rule</span>
                      <p class="rule-box-text">{{ getEarningRuleText(rule) }}</p>
                    </div>
                    <div class="rule-box usage">
                      <div class="rule-box-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                      </div>
                      <span class="rule-box-label">Usage rule</span>
                      <p class="rule-box-text">{{ getUsageRuleText(rule) }}</p>
                      @if (rule.bonusLifespanDays) {
                        <div class="rule-box-meta">
                          <span>Bonus lifespan: {{ rule.bonusLifespanDays }} days</span>
                        </div>
                      }
                    </div>
                  </div>
                  <div class="rules-criteria-row">
                    <div class="criteria-card min-spend">
                      <div class="criteria-card-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 01 0-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16a2 2 0 002-2V9"/><path d="M18 12v4"/><path d="M14 12v4"/></svg>
                      </div>
                      <h3 class="criteria-card-title">Minimum spend</h3>
                      <p class="criteria-card-text">{{ getMinSpendCardText(rule) }}</p>
                    </div>
                    <div class="criteria-card eligibility">
                      <div class="criteria-card-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14"/></svg>
                      </div>
                      <h3 class="criteria-card-title">Eligibility</h3>
                      <p class="criteria-card-text">{{ getEligibilityCardText(rule) }}</p>
                    </div>
                  </div>
                } @else {
                  <div class="empty-inline">
                    <p>No cashback rules defined for this program.</p>
                  </div>
                }
              </section>
            </div>
          }

          <!-- TIERS -->
          @if (activeTab === 'tiers') {
            <section class="card">
              <h2 class="card-title">Tiers</h2>
              @if (program.cashbackTiers && program.cashbackTiers.length > 0) {
                <p class="card-desc">Customers move up tiers based on total spend during the program period.</p>

                <!-- Progress track -->
                <div class="progress-track">
                  @for (tier of sortedTiers; track tier.sortOrder; let i = $index; let last = $last) {
                    <div class="track-segment" [class.last]="last">
                      <div class="track-node">
                        <span class="track-tier-name">{{ tier.name }}</span>
                        <span class="track-tier-badge">+{{ tier.extraEarningPercent }}%</span>
                      </div>
                      @if (!last) {
                        <div class="track-connector">
                          <span class="track-range">{{ formatTierRange(tier) }}</span>
                          <svg class="track-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </div>
                      }
                    </div>
                  }
                </div>

                <!-- Per-tier detail + clients -->
                @for (tier of sortedTiers; track tier.sortOrder; let i = $index) {
                  <div class="tier-detail">
                    <div class="tier-detail-header">
                      <h3 class="tier-detail-title">{{ tier.name }}</h3>
                      <span class="tier-detail-range">{{ formatTierRange(tier) }}</span>
                      <button type="button" class="link-eligibility" (click)="openEligibilityPopover($event, tier)">
                        View eligibility rules
                      </button>
                    </div>
                    <div class="tier-clients-section">
                      @if (getTierClients(tier).length > 0) {
                        <p class="tier-clients-summary">
                          You have {{ getTierClients(tier).length }} client{{ getTierClients(tier).length === 1 ? '' : 's' }} tiered in this level.
                          <a [routerLink]="getTierPageLink(tier)" class="link-view-clients">→ View clients</a>
                        </p>
                      } @else {
                        <p class="tier-clients-empty">
                          No clients in this tier yet.
                          <button type="button" class="link-eligibility" (click)="openEligibilityPopover($event, tier)">
                            View eligibility rules
                          </button>
                        </p>
                      }
                    </div>
                  </div>
                }
              } @else {
                <div class="empty-tiers">
                  <div class="empty-tiers-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>
                    </svg>
                  </div>
                  <h3 class="empty-tiers-title">This program has no tiers</h3>
                  <p class="empty-tiers-desc">
                    Tiers reward your best customers with higher cashback as they spend more. They increase motivation to return and help you recognize loyalty.
                  </p>
                  <p class="empty-tiers-cta">
                    Add tiers when editing this program to unlock tiered rewards (e.g. Bronze, Silver, Gold) and watch repeat spend grow.
                  </p>
                </div>
              }
            </section>
          }

          <!-- SCHEDULE -->
          @if (activeTab === 'schedule') {
            <div class="tab-cards">
              <section class="card card-span program-period-card">
                <h2 class="card-title">Program Period</h2>
                <div class="period-hero">
                  <span class="period-date start">{{ formatDateShort(program.startDate) }}</span>
                  <span class="period-sep">→</span>
                  <span class="period-date end">{{ program.endDate ? formatDateShort(program.endDate) : 'No end' }}</span>
                </div>
                @if (program.endDate) {
                  <p class="period-info-copy">This program is live only until {{ formatDateShort(program.endDate) }}.</p>
                } @else {
                  <p class="period-info-copy">This program is always on, until you deactivate it.</p>
                }
              </section>
              <section class="card card-span">
                <h2 class="card-title card-title-with-icon">
                  <svg class="card-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Weekly Schedule
                </h2>
                @if (program.weeklySchedules && program.weeklySchedules.length > 0) {
                  <div class="schedule-blocks">
                    @for (day of sortedScheduleDays; track day.dayOfWeek) {
                      <div class="schedule-block" [class.on]="day.enabled" [class.off]="!day.enabled">
                        <span class="schedule-block-day">{{ dayShort(day.dayOfWeek) }}</span>
                        <span class="schedule-block-time">{{ day.enabled ? (day.startTime && day.endTime ? formatTimeHHMM(day.startTime) + ' – ' + formatTimeHHMM(day.endTime) : 'All day') : 'Off' }}</span>
                      </div>
                    }
                  </div>
                  <p class="schedule-timezone-note">Bonuses apply only during the weekly schedule below.</p>
                  <p class="schedule-timezone-note">Times are shown in your local timezone.</p>
                } @else {
                  <p class="strip-all-day">Active every day, all day.</p>
                }
              </section>
            </div>
          }
        </div>

        <!-- Eligibility popover -->
        @if (eligibilityPopoverTier) {
          <div class="popover-backdrop" (click)="closeEligibilityPopover()"></div>
          <div class="popover" [style.left.px]="popoverX" [style.top.px]="popoverY" role="dialog" aria-label="Eligibility rules">
            <p class="popover-text">{{ getEligibilityHumanText(eligibilityPopoverTier) }}</p>
            <button type="button" class="popover-close" (click)="closeEligibilityPopover()">Close</button>
          </div>
        }

        <app-dialog
          [visible]="!!confirmAction"
          [title]="confirmDialogTitle"
          [message]="confirmDialogMessage"
          [confirmLabel]="confirmDialogConfirmLabel"
          cancelLabel="Cancel"
          (confirmed)="onConfirmAction()"
          (cancelled)="confirmAction = null"
          (closed)="confirmAction = null">
        </app-dialog>
      </div>
    }
  `,
  styles: [`
    .page-shell { max-width: 1400px; margin: 0 auto; padding: 0 1.5rem 3rem; }

    .loading-state, .error-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 1rem; padding: 6rem 0; color: #64748b;
    }
    .spinner {
      width: 36px; height: 36px; border: 3px solid #e2e8f0;
      border-top-color: var(--primary-color, #15803d);
      border-radius: 50%; animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-icon { width: 40px; height: 40px; color: #ef4444; }
    .btn-retry {
      padding: 0.5rem 1.25rem; border: 1px solid #e2e8f0; border-radius: 8px;
      background: #fff; font-size: 0.875rem; font-weight: 500; cursor: pointer;
      color: #0f172a; transition: all 0.15s;
    }
    .btn-retry:hover { border-color: var(--primary-color, #15803d); color: var(--primary-color, #15803d); }

    /* Program Summary header */
    .program-summary {
      display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; margin-bottom: 1.75rem; flex-wrap: wrap;
    }
    .summary-left { display: flex; flex-direction: column; gap: 0.25rem; }
    .summary-title {
      font-size: 2.5rem; font-weight: 700; color: #0f172a;
      margin: 0; letter-spacing: -0.03em; line-height: 1.2;
    }
    .summary-badge {
      display: inline-flex; align-items: center; gap: 0.4rem;
      font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.05em; padding: 0.25rem 1rem; border-radius: 6px; align-self: flex-start;
    }
    .summary-badge-icon { display: inline-flex; width: 16px; height: 16px; flex-shrink: 0; }
    .summary-badge-icon svg { width: 100%; height: 100%; }
    .summary-badge-text { text-transform: none; }
    .summary-badge[data-status="ACTIVE"]    { background: #dcfce7; color: #15803d; }
    .summary-badge[data-status="SCHEDULED"] { background: #e0f2fe; color: #0369a1; }
    .summary-badge[data-status="DRAFT"]     { background: #fef3c7; color: #92400e; }
    .summary-badge[data-status="INACTIVE"]  { background: #fee2e2; color: #991b1b; }
    .summary-badge[data-status="ARCHIVED"]  { background: #f1f5f9; color: #475569; }

    .summary-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
    .btn-action {
      padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.8125rem;
      font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: all 0.15s;
    }
    .btn-secondary {
      background: #f1f5f9; color: #475569; border-color: #e2e8f0;
    }
    .btn-secondary:hover { background: #e2e8f0; }
    .btn-primary {
      background: var(--primary-color, #15803d); color: #fff; border-color: var(--primary-color, #15803d);
    }
    .btn-primary:hover { background: var(--primary-color-hover, #14532d); }
    .btn-outline { background: #fff; color: #475569; border-color: #e2e8f0; }
    .btn-outline:hover { border-color: #94a3b8; }
    .btn-outline-danger { background: #fff; color: #dc2626; border-color: #fecaca; }
    .btn-outline-danger:hover { background: #fef2f2; border-color: #f87171; }

    /* Tabs */
    .tabs-bar {
      display: flex; gap: 0; border-bottom: 1px solid #cbd5e1; margin-bottom: 1.5rem;
    }
    .tab-item {
      padding: 0.75rem 1.25rem; background: none; border: none;
      font-size: 0.875rem; font-weight: 500; color: #64748b;
      cursor: pointer; position: relative; transition: color 0.15s; border-radius: 6px 6px 0 0;
      text-decoration: none;
    }
    .tab-item::after {
      content: ''; position: absolute; left: 0; right: 0; bottom: -1px;
      height: 2px; background: transparent; border-radius: 1px; transition: background 0.15s;
    }
    .tab-item:hover { color: #0f172a; }
    .tab-item[aria-selected="true"] { color: var(--primary-color, #15803d); }
    .tab-item[aria-selected="true"]::after { background: var(--primary-color, #15803d); }

    .tab-content { min-height: 280px; }
    .tab-cards {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem;
    }
    .tab-cards .card-span { grid-column: 1 / -1; }

    /* Cards: white, clear border and shadow so they don't blend with page background */
    .card {
      background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px;
      padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .card-title {
      font-size: 0.75rem; font-weight: 600; color: #64748b;
      text-transform: uppercase; letter-spacing: 0.06em;
      margin: 0 0 0.75rem 0; padding-bottom: 0.5rem; border-bottom: 1px solid #e2e8f0;
    }
    .card-title-with-icon {
      display: flex; align-items: center; gap: 0.5rem;
    }
    .card-title-icon {
      width: 18px; height: 18px; color: #64748b; flex-shrink: 0;
    }
    .card-desc {
      font-size: 0.8125rem; color: #64748b; margin: 0 0 0.75rem 0; line-height: 1.45;
    }
    .overview-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
    .overview-cards .card-span { grid-column: 1 / -1; }
    .cashback-glance .stats-row { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; }
    .glance-two-views { display: flex; gap: 2rem; flex-wrap: wrap; margin-bottom: 0; }
    .glance-view { display: flex; flex-direction: column; gap: 0.2rem; }
    .glance-view-label { font-size: 0.6875rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; }
    .glance-view-value { font-size: 1.5rem; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
    .stats-row { display: flex; gap: 1.5rem; flex-wrap: wrap; }
    .stat-block { display: flex; flex-direction: column; gap: 0.25rem; min-width: 100px; }
    .stat-value { font-size: 1.25rem; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
    .stat-label { font-size: 0.6875rem; font-weight: 500; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; }
    .rule-box-meta {
      font-size: 0.75rem; color: #64748b; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.2rem;
    }

    /* Typography: labels smaller/greyer, values bolder */
    .info-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .info-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; }
    .info-label {
      font-size: 0.6875rem; font-weight: 500; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0;
    }
    .info-value {
      font-size: 0.875rem; font-weight: 700; color: #0f172a; text-align: right;
    }
    .description-text { text-align: right; max-width: 220px; line-height: 1.4; white-space: pre-wrap; font-weight: 500; }

    .status-dot {
      display: inline-block; width: 6px; height: 6px; border-radius: 50%;
      margin-right: 0.25rem; vertical-align: middle;
    }
    .status-dot[data-status="ACTIVE"]    { background: #22c55e; }
    .status-dot[data-status="SCHEDULED"] { background: #0ea5e9; }
    .status-dot[data-status="DRAFT"]     { background: #f59e0b; }
    .status-dot[data-status="INACTIVE"]  { background: #ef4444; }
    .status-dot[data-status="ARCHIVED"]  { background: #94a3b8; }

    /* Schedule strip (grouped, Mon–Sun order) */
    .schedule-strip { display: flex; flex-direction: column; gap: 0.25rem; }
    .strip-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.4rem 0.5rem; border-radius: 6px; font-size: 0.8125rem;
    }
    .strip-row:not(.off) { background: #f0fdf4; }
    .strip-row.off { background: #f1f5f9; color: #94a3b8; }
    .strip-label { font-weight: 600; color: #0f172a; }
    .strip-row.off .strip-label { color: #94a3b8; font-weight: 500; }
    .strip-time { font-weight: 600; color: var(--primary-color, #15803d); }
    .strip-row.off .strip-time { color: #94a3b8; font-weight: 500; font-style: italic; }
    .strip-all-day { font-size: 0.8125rem; color: #64748b; margin: 0; }
    .program-period-card .period-hero {
      display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    .period-date {
      font-size: 1.125rem; font-weight: 700; color: #0f172a;
      padding: 0.5rem 1rem; border-radius: 10px; background: #f0fdf4; border: 1px solid #dcfce7;
    }
    .period-date.end:empty { display: none; }
    .period-sep { font-size: 1rem; color: #94a3b8; font-weight: 600; }
    .period-info-copy {
      font-size: 0.8125rem; color: #64748b; line-height: 1.5; margin: 0 0 0.35rem 0;
    }
    .schedule-by-day { display: flex; flex-direction: column; gap: 0.35rem; }

    /* Weekly schedule: reference layout – 7 blocks, day + time inside each, no controls */
    .schedule-blocks {
      display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem;
    }
    .schedule-block {
      min-height: 72px; padding: 0.75rem;
      border-radius: 10px; border: 1px solid transparent;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 0.35rem; text-align: center;
    }
    .schedule-block.on {
      background: #dcfce7; border-color: #86efac; color: #166534;
    }
    .schedule-block.off {
      background: #f1f5f9; border-color: #e2e8f0; color: #64748b;
    }
    .schedule-block-day {
      font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
    }
    .schedule-block.on .schedule-block-day { color: #15803d; }
    .schedule-block.off .schedule-block-day { color: #94a3b8; }
    .schedule-block-time {
      font-size: 0.8125rem; font-weight: 600;
    }
    .schedule-block.on .schedule-block-time { color: #0f172a; }
    .schedule-block.off .schedule-block-time { color: #94a3b8; font-style: italic; font-weight: 500; }
    .schedule-timezone-note {
      font-size: 0.75rem; color: #94a3b8; margin: 0.75rem 0 0 0;
    }

    .empty-inline { font-size: 0.875rem; color: #94a3b8; margin: 0; }

    /* Rules: full width, all cards same grey style */
    .rules-card { width: 100%; }
    .rules-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .rule-box {
      padding: 1rem 1.25rem; border-radius: 10px;
      border: 1px solid #e2e8f0; background: #f8fafc;
    }
    .rule-box-icon {
      width: 40px; height: 40px; border-radius: 8px;
      background: #e8f4ec; display: flex; align-items: center; justify-content: center;
      color: #15803d; margin-bottom: 0.75rem;
    }
    .rule-box-icon svg { width: 20px; height: 20px; }
    .rule-box-label {
      display: block; font-size: 0.6875rem; font-weight: 700; color: #64748b;
      text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.35rem;
    }
    .rule-box-text {
      font-size: 0.875rem; color: #0f172a; line-height: 1.5; margin: 0; font-weight: 500;
    }
    .rules-criteria-row {
      display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid #e2e8f0;
    }
    .criteria-card {
      padding: 1rem 1.25rem; border-radius: 10px;
      border: 1px solid #e2e8f0; background: #f8fafc;
    }
    .criteria-card-icon {
      width: 40px; height: 40px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 0.75rem; background: #e8f4ec; color: #15803d;
    }
    .criteria-card-icon svg { width: 20px; height: 20px; }
    .criteria-card-title {
      font-size: 0.6875rem; font-weight: 700; color: #64748b;
      text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 0.35rem 0;
    }
    .criteria-card-text {
      font-size: 0.875rem; color: #0f172a; line-height: 1.5; margin: 0; font-weight: 500;
    }

    /* Schedule: day strip + bars + summary */
    .schedule-visual { display: flex; flex-direction: column; gap: 0.75rem; }
    .schedule-days-row {
      display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.25rem; text-align: center;
    }
    .schedule-day-abbr {
      font-size: 0.75rem; font-weight: 600; color: #64748b;
    }
    .schedule-bars-row {
      display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.25rem;
    }
    .schedule-bar {
      height: 28px; border-radius: 6px; transition: background 0.15s;
    }
    .schedule-bar.on { background: #86efac; border: 1px solid #4ade80; }
    .schedule-bar.off { background: #e2e8f0; border: 1px solid #cbd5e1; }
    .schedule-summary {
      font-size: 0.875rem; color: #0f172a; font-weight: 600; margin: 0;
      display: flex; flex-wrap: wrap; gap: 0.5rem 1rem;
    }
    .schedule-summary-item {
      display: inline;
    }

    /* Progress track (horizontal) */
    .progress-track {
      display: flex; align-items: center; flex-wrap: wrap; gap: 0;
      margin-bottom: 1.5rem; padding: 0.75rem 0;
    }
    .track-segment { display: flex; align-items: center; }
    .track-node {
      display: flex; flex-direction: column; align-items: center; gap: 0.25rem;
      padding: 0.75rem 1rem; background: #f0fdf4; border: 1px solid #dcfce7;
      border-radius: 10px; min-width: 90px;
    }
    .track-tier-name { font-size: 0.875rem; font-weight: 700; color: #0f172a; }
    .track-tier-badge { font-size: 0.6875rem; font-weight: 700; color: var(--primary-color, #15803d); }
    .track-connector {
      display: flex; align-items: center; gap: 0.25rem;
      padding: 0 0.5rem; color: #94a3b8; font-size: 0.6875rem;
    }
    .track-range { font-weight: 600; color: #64748b; }
    .track-arrow { width: 16px; height: 16px; flex-shrink: 0; }
    .track-segment.last .track-connector { display: none; }

    /* Tier detail */
    .tier-detail {
      border: 1px solid #cbd5e1; border-radius: 12px;
      padding: 1.25rem; background: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .tier-detail + .tier-detail { margin-top: 1rem; }
    .tier-detail-header {
      display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.75rem;
    }
    .tier-detail-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0; }
    .tier-detail-range { font-size: 0.8125rem; color: #64748b; font-weight: 600; }
    .link-eligibility {
      background: none; border: none; padding: 0; font-size: 0.8125rem;
      font-weight: 600; color: var(--primary-color, #15803d); cursor: pointer;
      text-decoration: underline; text-underline-offset: 2px;
    }
    .link-eligibility:hover { color: var(--primary-color-hover, #14532d); }

    .tier-clients-section { padding-top: 0.75rem; border-top: 1px solid #f1f5f9; }
    .tier-clients-summary {
      margin: 0; font-size: 0.875rem; color: #475569;
      display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;
    }
    .link-view-clients {
      background: none; border: none; padding: 0; font-size: 0.875rem; font-weight: 600;
      color: var(--primary-color, #15803d); cursor: pointer;
      text-decoration: none; display: inline-flex; align-items: center;
    }
    .link-view-clients:hover { text-decoration: underline; }

    .tier-clients-empty {
      margin: 0; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 8px;
      border: 1px dashed #cbd5e1; font-size: 0.8125rem; color: #64748b;
      display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;
    }
    .tier-clients-empty .link-eligibility { font-size: 0.8125rem; }
    .tiered-clients-modal-body { min-height: 200px; }
    .tiered-clients-loading {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 1rem; padding: 3rem; color: #64748b;
    }
    .tiered-clients-loading .spinner {
      width: 32px; height: 32px; border: 3px solid #e2e8f0;
      border-top-color: var(--primary-color, #15803d); border-radius: 50%;
      animation: spin .7s linear infinite;
    }
    .tiered-clients-empty-msg { font-size: 0.9375rem; color: #64748b; margin: 0; padding: 1.5rem; }
    .tiered-clients-table-wrap { overflow-x: auto; margin-bottom: 1rem; }
    .tiered-clients-table {
      width: 100%; border-collapse: collapse; font-size: 0.875rem;
    }
    .tiered-clients-table th {
      text-align: left; padding: 0.6rem 0.75rem; font-weight: 600;
      color: #64748b; font-size: 0.6875rem; text-transform: uppercase;
      letter-spacing: 0.04em; background: #f8fafc; border-bottom: 1px solid #e2e8f0;
    }
    .tiered-clients-table td {
      padding: 0.6rem 0.75rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;
    }
    .tiered-clients-table tbody tr:hover { background: #f8fafc; }
    .tiered-clients-table .client-link {
      font-weight: 600; color: var(--primary-color, #15803d); text-decoration: none;
    }
    .tiered-clients-table .client-link:hover { text-decoration: underline; }
    .tier-badge {
      display: inline-block; padding: 0.2rem 0.5rem; border-radius: 6px;
      font-size: 0.75rem; font-weight: 600; background: #e8f4ec; color: #15803d;
    }
    .progress-to-next { display: flex; align-items: center; gap: 0.5rem; }
    .progress-bar-track {
      width: 80px; height: 6px; border-radius: 3px; background: #e2e8f0; overflow: hidden; flex-shrink: 0;
    }
    .progress-bar-fill {
      height: 100%; border-radius: 3px; background: var(--primary-color, #15803d);
      transition: width 0.3s ease;
    }
    .progress-label { font-size: 0.8125rem; font-weight: 600; color: #0f172a; white-space: nowrap; }
    .next-tier-label { font-size: 0.75rem; color: #64748b; white-space: nowrap; }
    .top-tier-label { font-size: 0.75rem; color: #64748b; font-style: italic; }
    .link-profile {
      font-size: 0.8125rem; font-weight: 600; color: var(--primary-color, #15803d);
      text-decoration: none;
    }
    .link-profile:hover { text-decoration: underline; }
    .tiered-clients-pagination {
      display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
      padding-top: 1rem; border-top: 1px solid #e2e8f0;
    }
    .tiered-clients-pagination .page-btn {
      padding: 0.4rem 0.75rem; border-radius: 8px; font-size: 0.8125rem; font-weight: 600;
      background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569;
      cursor: pointer; transition: all 0.2s;
    }
    .tiered-clients-pagination .page-btn:hover:not(:disabled) {
      background: #e2e8f0; border-color: #cbd5e1; color: #0f172a;
    }
    .tiered-clients-pagination .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .tiered-clients-pagination .page-info { font-size: 0.8125rem; color: #64748b; }

    /* No-tiers empty (motivational) */
    .empty-tiers {
      text-align: center; padding: 2.5rem 1.5rem;
      background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .empty-tiers-icon {
      width: 48px; height: 48px; margin: 0 auto 1rem;
      border-radius: 10px; background: #e2e8f0;
      display: flex; align-items: center; justify-content: center; color: #94a3b8;
    }
    .empty-tiers-icon svg { width: 24px; height: 24px; }
    .empty-tiers-title {
      font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 0.5rem 0;
    }
    .empty-tiers-desc {
      font-size: 0.875rem; color: #64748b; line-height: 1.5;
      margin: 0 0 0.75rem 0; max-width: 400px; margin-left: auto; margin-right: auto;
    }
    .empty-tiers-cta {
      font-size: 0.8125rem; color: #94a3b8; line-height: 1.45; margin: 0;
    }

    /* Eligibility popover */
    .popover-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.2); z-index: 40;
    }
    .popover {
      position: fixed; z-index: 50;
      max-width: 320px; padding: 1rem 1.25rem;
      background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.12);
    }
    .popover-text {
      font-size: 0.875rem; color: #0f172a; line-height: 1.5; margin: 0 0 0.75rem 0;
    }
    .popover-close {
      display: block; width: 100%; padding: 0.5rem;
      background: #f1f5f9; border: none; border-radius: 6px;
      font-size: 0.8125rem; font-weight: 600; color: #475569; cursor: pointer;
    }
    .popover-close:hover { background: #e2e8f0; }

    @media (max-width: 900px) {
      .tab-cards { grid-template-columns: 1fr; }
      .rules-two-col { grid-template-columns: 1fr; }
      .rules-criteria-row { grid-template-columns: 1fr; }
      .schedule-blocks { grid-template-columns: repeat(4, 1fr); }
      .progress-track { flex-direction: column; align-items: flex-start; }
      .track-segment { flex-direction: column; align-items: flex-start; }
      .track-connector { padding: 0.25rem 0 0.25rem 1rem; }
      .track-arrow { transform: rotate(-90deg); }
    }
    @media (max-width: 520px) {
      .schedule-blocks { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .program-summary { flex-direction: column; align-items: flex-start; }
      .summary-left { flex-direction: column; align-items: flex-start; }
      .info-row { flex-direction: column; gap: 0.15rem; }
      .info-value { text-align: left; }
    }
  `]
})
export class ProgramViewPageComponent implements OnInit, OnDestroy {
  program: RewardProgramResponse | null = null;
  loading = true;
  error: string | null = null;
  activeTab: Tab = 'overview';
  confirmAction: ConfirmAction | null = null;

  get confirmDialogTitle(): string {
    if (!this.confirmAction) return '';
    const t: Record<ConfirmAction, string> = {
      deactivate: 'Deactivate program?',
      archive: 'Archive program?',
      launchNow: 'Launch program now?'
    };
    return t[this.confirmAction];
  }

  get confirmDialogMessage(): string {
    if (!this.confirmAction) return '';
    const m: Record<ConfirmAction, string> = {
      deactivate: 'This program will be deactivated and will stop affecting customers.',
      archive: 'This program will be moved to the archive.',
      launchNow: 'It will start affecting customers and the start date will be set to today.'
    };
    return m[this.confirmAction];
  }

  get confirmDialogConfirmLabel(): string {
    if (!this.confirmAction) return 'Confirm';
    const l: Record<ConfirmAction, string> = {
      deactivate: 'Deactivate',
      archive: 'Archive',
      launchNow: 'Launch now'
    };
    return l[this.confirmAction];
  }

  /** UUID from route for tab links */
  get viewUuid(): string {
    return this.uuid;
  }

  /** Sorted Mon–Sun for display */
  get sortedTiers(): CashbackTierResponse[] {
    if (!this.program?.cashbackTiers?.length) return [];
    return [...this.program.cashbackTiers].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /** Schedule grouped (e.g. "Mon – Fri: 08:00 – 18:00") */
  get scheduleGroups(): ScheduleGroup[] {
    if (!this.program?.weeklySchedules?.length) return [];
    return this.groupSchedule(this.sortedScheduleDays);
  }

  /** True when different days have different times (use list view instead of bars) */
  get hasDifferentScheduleTimes(): boolean {
    const days = this.sortedScheduleDays;
    const enabled = days.filter(d => d.enabled);
    if (enabled.length <= 1) return false;
    const first = enabled[0];
    const same = enabled.every(d =>
      d.startTime === first?.startTime && d.endTime === first?.endTime
    );
    return !same;
  }

  /** One entry per weekday, Mon–Sun order (always 7; missing days are off) */
  get sortedScheduleDays(): WeeklyScheduleResponse[] {
    const order: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    if (!this.program?.weeklySchedules?.length) {
      return order.map(dayOfWeek => ({ dayOfWeek, enabled: false, startTime: null, endTime: null }));
    }
    const byDay = new Map<string, WeeklyScheduleResponse>();
    for (const d of this.program.weeklySchedules) {
      if (!byDay.has(d.dayOfWeek)) byDay.set(d.dayOfWeek, d);
    }
    return order.map(dayOfWeek =>
      byDay.get(dayOfWeek) ?? { dayOfWeek, enabled: false, startTime: null, endTime: null }
    );
  }

  eligibilityPopoverTier: CashbackTierResponse | null = null;
  popoverX = 0;
  popoverY = 0;

  private uuid = '';
  private pageHeaderService = inject(PageHeaderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private rewardService = inject(RewardProgramsService);
  private tierClientsMap = new Map<number, TierClientPlaceholder[]>();
  private routeParamSub?: ReturnType<typeof this.route.paramMap.subscribe>;

  private static readonly VALID_TABS: Tab[] = ['overview', 'tiers', 'schedule'];

  ngOnInit(): void {
    this.uuid = this.route.snapshot.paramMap.get('uuid') || '';
    if (!this.uuid) {
      this.error = 'Missing program identifier.';
      this.loading = false;
      return;
    }
    this.syncTabFromRoute();
    this.routeParamSub = this.route.paramMap.subscribe(() => this.syncTabFromRoute());
    this.loadProgram();
  }

  ngOnDestroy(): void {
    this.routeParamSub?.unsubscribe();
    this.pageHeaderService.clear();
  }

  private syncTabFromRoute(): void {
    const tab = this.route.snapshot.paramMap.get('tab') ?? 'overview';
    if (ProgramViewPageComponent.VALID_TABS.includes(tab as Tab)) {
      this.activeTab = tab as Tab;
    } else {
      this.router.navigate(['/bonus-program/view', this.uuid, 'overview'], { replaceUrl: true });
    }
  }

  loadProgram(): void {
    this.loading = true;
    this.error = null;
    this.tierClientsMap.clear();
    this.rewardService.getProgram(this.uuid).subscribe({
      next: (p) => {
        if (p.status === 'DRAFT') {
          this.router.navigate(['/bonus-program', 'create', p.type.toLowerCase(), p.uuid]);
          return;
        }
        this.program = p;
        this.loading = false;
        this.setPageHeader();
        this.loadTieredClientsForTiersSection();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load program.';
        this.loading = false;
      }
    });
  }

  /** Load tiered clients once to populate inline "Clients in this tier" per tier */
  private loadTieredClientsForTiersSection(): void {
    if (!this.program?.uuid || !this.program.cashbackTiers?.length) return;
    this.rewardService.getTieredClients(this.program.uuid, 0, 500).subscribe({
      next: (res) => {
        const bySortOrder = new Map<number, TierClientPlaceholder[]>();
        for (const row of res.content) {
          const list = bySortOrder.get(row.tierSortOrder) ?? [];
          list.push({
            clientUuid: row.clientUuid,
            name: row.clientName,
            phone: row.phone ?? undefined,
            totalSpend: row.programPeriodSpend
          });
          bySortOrder.set(row.tierSortOrder, list);
        }
        this.tierClientsMap = bySortOrder;
      }
    });
  }

  private setPageHeader(): void {
    if (!this.program) return;
    this.pageHeaderService.setPageHeader('Program View', [
      { label: 'Home', route: '/home' },
      { label: 'Reward Programs', route: '/bonus-program' },
      { label: 'Program View', route: '/bonus-program/view/' + this.program.uuid }
    ]);
  }

  /** Group consecutive days with same schedule into "Mon – Fri: 08:00 – 18:00" */
  private groupSchedule(days: WeeklyScheduleResponse[]): ScheduleGroup[] {
    const short: Record<string, string> = {
      MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu',
      FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun'
    };
    const groups: ScheduleGroup[] = [];
    let i = 0;
    while (i < days.length) {
      const d = days[i];
      const time = d.enabled
        ? (d.startTime && d.endTime ? `${d.startTime} – ${d.endTime}` : 'All day')
        : 'Off';
      let j = i + 1;
      while (
        j < days.length &&
        days[j].enabled === d.enabled &&
        (d.enabled
          ? (days[j].startTime === d.startTime && days[j].endTime === d.endTime)
          : true)
      ) {
        j++;
      }
      const startDay = short[d.dayOfWeek] ?? d.dayOfWeek;
      const endDay = j - 1 > i ? short[days[j - 1].dayOfWeek] ?? days[j - 1].dayOfWeek : startDay;
      const label = startDay === endDay ? startDay : `${startDay} – ${endDay}`;
      groups.push({ label, time, enabled: d.enabled });
      i = j;
    }
    return groups;
  }

  formatTierRange(tier: CashbackTierResponse): string {
    const min = tier.minAmount.toLocaleString('en-US') + ' ₸';
    const max = tier.maxAmount != null ? tier.maxAmount.toLocaleString('en-US') + ' ₸' : 'No cap';
    return `${min} – ${max}`;
  }

  dayShort(dayOfWeek: string): string {
    const m: Record<string, string> = {
      MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu',
      FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun'
    };
    return m[dayOfWeek] ?? dayOfWeek;
  }

  getEarningRuleText(rule: CashbackProgramRuleResponse): string {
    const value = rule.cashbackType === 'PERCENTAGE'
      ? `${rule.cashbackValue}%`
      : `${rule.cashbackValue} pts`;
    const min = rule.minSpendAmount.toLocaleString('en-US');
    return `Earn ${value} back on every purchase over ${min} ₸.`;
  }

  getUsageRuleText(rule: CashbackProgramRuleResponse): string {
    const parts: string[] = [];
    parts.push(`Redeem up ${rule.redeemLimitPercent}% of your bill.`);
    if (rule.bonusLifespanDays != null) {
      parts.push(`Points expire in ${rule.bonusLifespanDays} days.`);
    }
    return parts.join(' ');
  }

  getEligibilityHumanText(tier: CashbackTierResponse): string {
    const min = tier.minAmount.toLocaleString('en-US');
    if (tier.maxAmount != null) {
      const maxStr = tier.maxAmount.toLocaleString('en-US');
      return `To reach ${tier.name}, a customer must spend between ${min} ₸ and ${maxStr} ₸ within the program period.`;
    }
    return `To reach ${tier.name}, a customer must spend a total of ${min} ₸ or more within the program period.`;
  }

  openEligibilityPopover(event: MouseEvent, tier: CashbackTierResponse): void {
    this.eligibilityPopoverTier = tier;
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.popoverX = Math.min(rect.left, window.innerWidth - 340);
    this.popoverY = rect.bottom + 8;
  }

  closeEligibilityPopover(): void {
    this.eligibilityPopoverTier = null;
  }

  getTierPageLink(tier: CashbackTierResponse): string[] {
    if (!this.program?.uuid) return ['/bonus-program'];
    return ['/bonus-program', 'view', this.program.uuid, 'tier', encodeURIComponent(tier.name)];
  }

  onAdjustProgram(): void {
    // Mock: could navigate to configure or show toast
  }

  getTierClients(tier: CashbackTierResponse): TierClientPlaceholder[] {
    return this.tierClientsMap.get(tier.sortOrder) ?? [];
  }

  typeLabel(t: RewardProgramType): string {
    const m: Record<RewardProgramType, string> = {
      CASHBACK: 'Cashback', WELCOME: 'Welcome', BIRTHDAY: 'Birthday', REFERRAL: 'Referral'
    };
    return m[t] ?? t;
  }

  statusLabel(s: RewardProgramStatus): string {
    const m: Record<RewardProgramStatus, string> = {
      ACTIVE: 'Active', SCHEDULED: 'Scheduled', DRAFT: 'Draft',
      INACTIVE: 'Inactive', ARCHIVED: 'Archived'
    };
    return m[s] ?? s;
  }

  cashbackTypeLabel(t: CashbackType): string {
    return t === 'PERCENTAGE' ? 'Percentage (%)' : 'Bonus Points';
  }

  eligibilityLabel(t: EligibilityType): string {
    const m: Record<EligibilityType, string> = {
      ALL: 'All items and categories',
      SPECIFIC_ITEMS: 'Specific items',
      SPECIFIC_CATEGORIES: 'Specific categories',
      SPECIFIC_SERVICES: 'Specific services'
    };
    return m[t] ?? t;
  }

  /** Copy for the Min. spend criteria card */
  getMinSpendCardText(rule: CashbackProgramRuleResponse): string {
    const amount = rule.minSpendAmount.toLocaleString('en-US');
    return `Bonuses apply only to payment transactions that meet or exceed ${amount} ₸.`;
  }

  /** Copy for the Eligibility criteria card */
  getEligibilityCardText(rule: CashbackProgramRuleResponse): string {
    const t = rule.eligibilityType;
    if (t === 'ALL') return 'Bonuses apply to all purchases—any item or category qualifies.';
    if (t === 'SPECIFIC_ITEMS') return 'Bonuses apply only to transactions made to buy specific items.';
    if (t === 'SPECIFIC_CATEGORIES') return 'Bonuses apply only to transactions made to buy items from specific categories.';
    if (t === 'SPECIFIC_SERVICES') return 'Bonuses apply only to transactions made to buy specific services.';
    return `Bonuses apply to purchases of ${this.eligibilityLabel(t).toLowerCase()}.`;
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return iso; }
  }

  formatDateShort(iso: string | null): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch { return iso; }
  }

  /** Time as HH:MM (strips seconds if present, e.g. 08:00:00 → 08:00) */
  formatTimeHHMM(value: string | null): string {
    if (!value) return '—';
    const trimmed = value.trim();
    if (trimmed.length >= 5) return trimmed.slice(0, 5);
    return trimmed;
  }

  getCashbackPerSpendText(rule: CashbackProgramRuleResponse): string {
    if (rule.cashbackType === 'PERCENTAGE') {
      return `${rule.cashbackValue} ₸ back per 100₸`;
    }
    return `${rule.cashbackValue} pts per ${rule.pointsSpendThreshold} ₸`;
  }

  formatCashbackValue(rule: CashbackProgramRuleResponse): string {
    return rule.cashbackType === 'PERCENTAGE'
      ? `${rule.cashbackValue}%`
      : `${rule.cashbackValue} pts`;
  }

  onConfirmAction(): void {
    const action = this.confirmAction;
    this.confirmAction = null;
    if (!action || !this.program) return;
    if (action === 'deactivate') this.doDeactivate();
    else if (action === 'archive') this.doArchive();
    else if (action === 'launchNow') this.doLaunchNow();
  }

  private doDeactivate(): void {
    if (!this.program) return;
    this.rewardService.deactivateProgram(this.program.uuid).subscribe({
      next: (p) => { this.program = p; this.setPageHeader(); },
      error: () => {}
    });
  }

  private doLaunchNow(): void {
    if (!this.program) return;
    this.rewardService.launchCashbackProgram(this.program.uuid, { immediate: true }).subscribe({
      next: (p) => {
        this.program = p;
        this.setPageHeader();
      },
      error: () => {}
    });
  }

  private doArchive(): void {
    if (!this.program) return;
    this.rewardService.archiveProgram(this.program.uuid).subscribe({
      next: (p) => { this.program = p; this.setPageHeader(); },
      error: () => {}
    });
  }
}
