import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PageHeaderService } from '../../../../core/services/page-header.service';
import { ToastService } from '../../../../core/services/toast.service';
import { RewardProgramsService } from '../../../../core/services/reward-programs.service';
import { DialogComponent } from '../../../../shared/components/dialog/dialog.component';
import {
  RewardProgramListItem,
  RewardProgramStatus,
  RewardProgramType,
  RewardProgramResponse,
  LaunchCashbackProgramRequest
} from '../../../../core/models/reward-program.model';
import { rewardProgramTypeToSlug } from '../../../../core/services/reward-programs.service';

type FilterTab = 'All' | 'Active' | 'Draft' | 'Scheduled' | 'Archived' | 'Inactive';

type ConfirmAction = 'launchNow' | 'deactivate' | 'delete';
interface ConfirmState {
  action: ConfirmAction;
  program: RewardProgramListItem;
}

function formatDateRange(startDate: string | null, endDate: string | null): string {
  const start = startDate ? new Date(startDate).toLocaleDateString() : '—';
  const end = endDate ? new Date(endDate).toLocaleDateString() : '∞';
  return `${start} – ${end}`;
}

function typeToLabel(type: RewardProgramType): string {
  const map: Record<RewardProgramType, string> = {
    WELCOME: 'Welcome',
    BIRTHDAY: 'Birthday',
    REFERRAL: 'Referral',
    CASHBACK: 'Cashback'
  };
  return map[type] ?? type;
}

function statusToLabel(status: RewardProgramStatus): string {
  const map: Record<RewardProgramStatus, string> = {
    DRAFT: 'Draft',
    SCHEDULED: 'Scheduled',
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    ARCHIVED: 'Archived'
  };
  return map[status] ?? status;
}

function formatBonusType(program: RewardProgramListItem): { line1: string; line2: string } {
  if (program.type !== 'CASHBACK') {
    return { line1: '—', line2: '' };
  }
  const ct = program.cashbackType;
  const value = program.cashbackValue ?? 0;
  const minSpend = program.minSpendAmount ?? 0;
  const ptsThreshold = program.pointsSpendThreshold;
  if (ct === 'PERCENTAGE') {
    return { line1: 'Percentage', line2: `${value}% per order` };
  }
  if (ct === 'BONUS_POINTS') {
    const per = ptsThreshold != null && Number(ptsThreshold) > 0
      ? ` per ${Number(ptsThreshold)} spend`
      : ' per order';
    return { line1: 'Bonus points', line2: `${value} pts earned${per}` };
  }
  return { line1: '—', line2: '' };
}

@Component({
  selector: 'app-bonus-program-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DialogComponent],
  template: `
    <div class="page-wrapper">
      <div class="programs-container">
        <div class="intro-row">
          <p class="intro-text">
            Increase engagement with your loyalty program. Create a promotion where members can earn extra points when they shop at designated times — perfect for happy hour or holidays.
          </p>
          <a routerLink="/bonus-program/programs" class="btn-create-program">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Create program
          </a>
        </div>

        <div class="tabs-row">
          <div class="tabs">
            <button type="button" class="tab" [class.active]="activeTab === 'All'" (click)="activeTab = 'All'">All</button>
            <button type="button" class="tab" [class.active]="activeTab === 'Active'" (click)="activeTab = 'Active'">Active</button>
            <button type="button" class="tab" [class.active]="activeTab === 'Draft'" (click)="activeTab = 'Draft'">Draft</button>
            <button type="button" class="tab" [class.active]="activeTab === 'Scheduled'" (click)="activeTab = 'Scheduled'">Scheduled</button>
            <button type="button" class="tab" [class.active]="activeTab === 'Inactive'" (click)="activeTab = 'Inactive'">Inactive</button>
            <button type="button" class="tab" [class.active]="activeTab === 'Archived'" (click)="activeTab = 'Archived'">Archived</button>
          </div>
          <span class="tab-count">{{ filteredPrograms.length }} program{{ filteredPrograms.length === 1 ? '' : 's' }}</span>
        </div>

        @if (loading) {
          <p class="loading-message">Loading programs…</p>
        } @else if (loadError) {
          <p class="error-message">{{ loadError }}</p>
        } @else if (programs.length === 0) {
          <div class="table-wrap empty-state-wrap">
            <div class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M20 12v9H4v-9"/><rect x="2" y="7" width="20" height="5" rx="1"/><path d="M12 22V7"/><path d="M12 7c-2-2-4-2.5-4-4.5a2 2 0 0 1 4 0c0 1.5-2 2-4 4.5"/><path d="M12 7c2-2 4-2.5 4-4.5a2 2 0 0 0-4 0c0 1.5 2 2 4 4.5"/>
              </svg>
              <span>You don't have programs created</span>
              <a routerLink="/bonus-program/programs" class="btn-create-loyalty">Create loyalty program</a>
            </div>
          </div>
        } @else {
          <div class="table-wrap">
            <table class="programs-table">
              <colgroup>
                <col style="width:22%">
                <col style="width:14%">
                <col style="width:22%">
                <col style="width:20%">
                <col style="width:14%">
                <col style="width:8%">
              </colgroup>
              <thead>
                <tr>
                  <th>Program name</th>
                  <th>Program type</th>
                  <th>Bonus type</th>
                  <th>Start date – End date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let program of paginatedPrograms" class="program-row" (click)="goToProgram(program)">
                  <td>
                    <span class="program-name">{{ program.name || 'Untitled' }}</span>
                  </td>
                  <td>
                    <span class="program-type-label">{{ typeToLabel(program.type) }}</span>
                  </td>
                  <td>
                    <div class="bonus-type-cell">
                      <span class="bonus-type-line1">{{ formatBonusType(program).line1 }}</span>
                      @if (formatBonusType(program).line2) {
                        <span class="bonus-type-line2">{{ formatBonusType(program).line2 }}</span>
                      }
                    </div>
                  </td>
                  <td class="date-cell">{{ formatDateRange(program.startDate, program.endDate) }}</td>
                  <td>
                    <span class="status-pill" [class.active]="program.status === 'ACTIVE'" [class.scheduled]="program.status === 'SCHEDULED'" [class.draft]="program.status === 'DRAFT'" [class.archived]="program.status === 'ARCHIVED'" [class.inactive]="program.status === 'INACTIVE'">
                      <span class="status-icon" [attr.aria-hidden]="true">
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
                      <span class="status-text">{{ statusToLabel(program.status) }}</span>
                    </span>
                  </td>
                  <td class="action-cell" (click)="$event.stopPropagation()">
                    <button type="button" class="btn-menu" (click)="toggleMenu(program.uuid)" [attr.aria-expanded]="openMenuUuid === program.uuid" aria-label="Actions">
                      <svg class="dots-icon" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/></svg>
                    </button>
                    @if (openMenuUuid === program.uuid) {
                      <div class="menu-dropdown">
                        @if (program.status === 'DRAFT') {
                          <button type="button" class="menu-item" (click)="actionContinueCreate(program)">Continue editing</button>
                        } @else {
                          <button type="button" class="menu-item" (click)="actionFullView(program)">Full view</button>
                        }
                        <button type="button" class="menu-item" (click)="actionReports(program)">Reports</button>
                        @if (program.status === 'SCHEDULED') {
                          <button type="button" class="menu-item" (click)="actionLaunchNow(program)">Launch now</button>
                        }
                        @if (program.status === 'ACTIVE') {
                          <button type="button" class="menu-item menu-item-danger" (click)="actionDeactivate(program)">Deactivate</button>
                        }
                        @if (program.status === 'INACTIVE' || program.status === 'ARCHIVED' || program.status === 'DRAFT') {
                          <button type="button" class="menu-item menu-item-danger" (click)="actionDelete(program)">Delete</button>
                        }
                      </div>
                    }
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="pagination">
            <button type="button" class="page-btn" [disabled]="currentPage <= 1" (click)="currentPage = currentPage - 1" aria-label="Previous">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span class="page-info">{{ filteredPrograms.length === 0 ? 0 : (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, filteredPrograms.length) }} of {{ filteredPrograms.length }}</span>
            <button type="button" class="page-btn" [disabled]="currentPage * pageSize >= filteredPrograms.length" (click)="currentPage = currentPage + 1" aria-label="Next">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        }
      </div>
    </div>

    <app-dialog
      [visible]="!!confirmState"
      [title]="confirmDialogTitle"
      [message]="confirmDialogMessage"
      [confirmLabel]="confirmDialogConfirmLabel"
      cancelLabel="Cancel"
      (confirmed)="onConfirmAction()"
      (cancelled)="confirmState = null"
      (closed)="confirmState = null">
    </app-dialog>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .page-wrapper { min-height: 100%; margin: -2rem; padding: 2rem; background: linear-gradient(180deg, #f1f5f9 0%, #f8fafc 100%); }
    .programs-container { max-width: 1400px; margin: 0 auto; }

    .intro-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .intro-text { flex: 1; min-width: 0; font-size: 0.95rem; color: #475569; line-height: 1.6; margin: 0; max-width: 720px; }
    .btn-create-program { flex-shrink: 0; display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.25rem; background: #16A34A; color: white; border-radius: 10px; font-size: 0.9rem; font-weight: 600; text-decoration: none; box-shadow: 0 1px 3px rgba(22, 163, 74, 0.25); }
    .btn-create-program:hover { background: #15803d; color: white; }
    .btn-icon { width: 18px; height: 18px; }

    .tabs-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; gap: 1rem; flex-wrap: wrap; }
    .tabs { display: flex; gap: 0; background: white; border-radius: 10px; padding: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .tab { padding: 0.5rem 1rem; border: none; background: transparent; border-radius: 8px; font-size: 0.875rem; font-weight: 500; color: #64748b; cursor: pointer; }
    .tab:hover { color: #0f172a; background: #f1f5f9; }
    .tab.active { background: #16A34A; color: white; }
    .tab-count { font-size: 0.875rem; color: #64748b; font-weight: 500; }

    .loading-message, .error-message { padding: 1.5rem; text-align: center; color: #64748b; }
    .error-message { color: #b91c1c; }

    .empty-state-wrap { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: visible; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05); }
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; color: #64748b; }
    .empty-state svg { width: 56px; height: 56px; margin-bottom: 1rem; color: #94a3b8; }
    .empty-state span { font-size: 1rem; margin-bottom: 1.25rem; }
    .btn-create-loyalty { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.25rem; background: #16A34A; color: white; border-radius: 10px; font-size: 0.9rem; font-weight: 600; text-decoration: none; box-shadow: 0 1px 3px rgba(22, 163, 74, 0.25); }
    .btn-create-loyalty:hover { background: #15803d; color: white; }

    .table-wrap { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: visible; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05); }
    .programs-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .programs-table th,
    .programs-table td { text-align: left; padding: 1rem 1.25rem; vertical-align: middle; }
    .programs-table th { font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .programs-table td { padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; color: #334155; }
    .program-row { cursor: pointer; }
    .program-row:hover { background: #f8fafc; }
    .program-row:last-child td { border-bottom: none; }

    .program-name { font-weight: 600; color: #0f172a; }
    .program-type-label { color: #475569; }
    .bonus-type-cell { display: flex; flex-direction: column; gap: 0.15rem; }
    .bonus-type-line1 { font-weight: 500; color: #0f172a; }
    .bonus-type-line2 { font-size: 0.8rem; color: #64748b; }
    .date-cell { color: #475569; font-variant-numeric: tabular-nums; }

    .status-pill { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.75rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; }
    .status-icon { display: inline-flex; width: 16px; height: 16px; }
    .status-icon svg { width: 100%; height: 100%; }
    .status-text { text-transform: none; }
    .status-pill.active { background: #dcfce7; color: #166534; }
    .status-pill.scheduled { background: #e0f2fe; color: #0369a1; }
    .status-pill.draft { background: #fef3c7; color: #b45309; }
    .status-pill.archived { background: #f1f5f9; color: #64748b; }
    .status-pill.inactive { background: #fee2e2; color: #b91c1c; }

    .action-cell { position: relative; text-align: right; }
    .btn-menu { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: none; border-radius: 10px; background: transparent; color: #64748b; cursor: pointer; }
    .btn-menu:hover { background: #f1f5f9; color: #0f172a; }
    .dots-icon { width: 20px; height: 20px; }
    .menu-dropdown { position: absolute; top: 100%; right: 0; margin-top: 4px; min-width: 160px; background: white; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.12); border: 1px solid #e2e8f0; padding: 4px; z-index: 100; }
    .menu-item { display: block; width: 100%; text-align: left; padding: 0.5rem 0.75rem; border: none; background: none; border-radius: 6px; font-size: 0.875rem; color: #334155; cursor: pointer; }
    .menu-item:hover { background: #f1f5f9; }
    .menu-item-danger { color: #b91c1c; }
    .menu-item-danger:hover { background: #fef2f2; }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1.5rem; }
    .page-btn { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; border-radius: 10px; background: white; color: #475569; cursor: pointer; }
    .page-btn:hover:not(:disabled) { background: #f8fafc; border-color: #16A34A; color: #16A34A; }
    .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .page-btn svg { width: 18px; height: 18px; }
    .page-info { font-size: 0.875rem; color: #64748b; }
  `]
})
export class BonusProgramPageComponent implements OnInit {
  private pageHeaderService = inject(PageHeaderService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private rewardProgramsService = inject(RewardProgramsService);

  activeTab: FilterTab = 'All';
  currentPage = 1;
  pageSize = 10;
  Math = Math;

  programs: RewardProgramListItem[] = [];
  loading = false;
  loadError = '';
  openMenuUuid: string | null = null;
  actionInProgress: string | null = null;
  confirmState: ConfirmState | null = null;

  get confirmDialogTitle(): string {
    if (!this.confirmState) return '';
    const t: Record<ConfirmAction, string> = {
      launchNow: 'Launch program now?',
      deactivate: 'Deactivate program?',
      delete: 'Delete program?'
    };
    return t[this.confirmState.action];
  }

  get confirmDialogMessage(): string {
    if (!this.confirmState) return '';
    const m: Record<ConfirmAction, string> = {
      launchNow: 'It will start affecting customers joining the loyalty program and the start date will be set to today.',
      deactivate: 'This program will be deactivated and will stop affecting customers.',
      delete: 'This program will be permanently deleted. This cannot be undone.'
    };
    return m[this.confirmState.action];
  }

  get confirmDialogConfirmLabel(): string {
    if (!this.confirmState) return 'Confirm';
    const l: Record<ConfirmAction, string> = {
      launchNow: 'Launch now',
      deactivate: 'Deactivate',
      delete: 'Delete'
    };
    return l[this.confirmState.action];
  }

  @HostListener('document:click') onDocumentClick(): void {
    this.openMenuUuid = null;
  }

  readonly formatDateRange = formatDateRange;
  readonly typeToLabel = typeToLabel;
  readonly statusToLabel = statusToLabel;
  readonly formatBonusType = formatBonusType;

  get filteredPrograms(): RewardProgramListItem[] {
    let list = this.programs;
    if (this.activeTab !== 'All') {
      const status = this.activeTab.toUpperCase() as RewardProgramStatus;
      list = list.filter(p => p.status === status);
    }
    return list;
  }

  get paginatedPrograms(): RewardProgramListItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredPrograms.slice(start, start + this.pageSize);
  }

  ngOnInit(): void {
    this.pageHeaderService.setPageHeader('Reward Programs', [
      { label: 'Главная', route: '/home' },
      { label: 'Reward Programs' }
    ]);
    this.loadPrograms();
  }

  private loadPrograms(): void {
    this.loading = true;
    this.loadError = '';
    this.rewardProgramsService.listPrograms().subscribe({
      next: (list) => {
        this.programs = list;
        this.loading = false;
      },
      error: (err) => {
        this.loadError = err?.error?.message || 'Failed to load programs.';
        this.loading = false;
      }
    });
  }

  toggleMenu(uuid: string): void {
    this.openMenuUuid = this.openMenuUuid === uuid ? null : uuid;
  }

  actionFullView(program: RewardProgramListItem): void {
    this.openMenuUuid = null;
    this.router.navigate(['/bonus-program', 'view', program.uuid]);
  }

  actionContinueCreate(program: RewardProgramListItem): void {
    this.openMenuUuid = null;
    this.goToDraftWizard(program);
  }

  actionReports(program: RewardProgramListItem): void {
    this.openMenuUuid = null;
    this.toast.show('Reports coming soon', 'success');
  }

  actionLaunchNow(program: RewardProgramListItem): void {
    this.openMenuUuid = null;
    this.confirmState = { action: 'launchNow', program };
  }

  private buildLaunchNowPayload(res: RewardProgramResponse): LaunchCashbackProgramRequest {
    const r = res.cashbackRule;
    const schedules = (res.weeklySchedules || []).map(s => ({
      dayOfWeek: s.dayOfWeek,
      enabled: s.enabled,
      startTime: s.startTime ?? null,
      endTime: s.endTime ?? null
    }));
    const tiers = (res.cashbackTiers || []).map((t, i) => ({
      name: t.name,
      minAmount: t.minAmount,
      maxAmount: t.maxAmount ?? null,
      extraEarningPercent: t.extraEarningPercent,
      sortOrder: i
    }));
    return {
      immediate: true,
      name: res.name ?? null,
      description: res.description ?? null,
      cashbackType: r?.cashbackType ?? null,
      cashbackValue: r?.cashbackValue ?? null,
      minSpendAmount: r?.minSpendAmount ?? null,
      eligibilityType: r?.eligibilityType ?? null,
      redeemLimitPercent: r?.redeemLimitPercent ?? null,
      bonusLifespanDays: r?.bonusLifespanDays ?? null,
      pointsSpendThreshold: r?.pointsSpendThreshold ?? null,
      startDate: new Date().toISOString(),
      endDate: res.endDate ?? null,
      weeklySchedules: schedules.length > 0 ? schedules : null,
      tiers: tiers.length > 0 ? tiers : null
    };
  }

  actionDeactivate(program: RewardProgramListItem): void {
    this.openMenuUuid = null;
    this.confirmState = { action: 'deactivate', program };
  }

  actionDelete(program: RewardProgramListItem): void {
    this.openMenuUuid = null;
    this.confirmState = { action: 'delete', program };
  }

  onConfirmAction(): void {
    const state = this.confirmState;
    if (!state || this.actionInProgress) return;
    this.confirmState = null;
    const program = state.program;
    this.actionInProgress = program.uuid;

    if (state.action === 'launchNow') {
      this.rewardProgramsService.getProgram(program.uuid).subscribe({
        next: (full) => {
          const payload = this.buildLaunchNowPayload(full);
          this.rewardProgramsService.launchCashbackProgram(program.uuid, payload).subscribe({
            next: () => {
              this.actionInProgress = null;
              this.toast.success('Program launched');
              this.loadPrograms();
            },
            error: (err) => {
              this.actionInProgress = null;
              this.toast.error(err?.error?.message || 'Failed to launch program');
            }
          });
        },
        error: (err) => {
          this.actionInProgress = null;
          this.toast.error(err?.error?.message || 'Failed to load program');
        }
      });
      return;
    }

    if (state.action === 'deactivate') {
      this.rewardProgramsService.deactivateProgram(program.uuid).subscribe({
        next: () => {
          this.actionInProgress = null;
          this.toast.success('Program deactivated');
          this.loadPrograms();
        },
        error: (err) => {
          this.actionInProgress = null;
          this.toast.error(err?.error?.message || 'Failed to deactivate');
        }
      });
      return;
    }

    if (state.action === 'delete') {
      this.rewardProgramsService.deleteProgram(program.uuid).subscribe({
        next: () => {
          this.actionInProgress = null;
          this.toast.success('Program deleted');
          this.loadPrograms();
        },
        error: (err) => {
          this.actionInProgress = null;
          this.toast.error(err?.error?.message || 'Failed to delete');
        }
      });
    }
  }

  goToProgram(program: RewardProgramListItem): void {
    if (program.status === 'DRAFT') {
      this.goToDraftWizard(program);
    } else {
      this.router.navigate(['/bonus-program', 'view', program.uuid]);
    }
  }

  private goToDraftWizard(program: RewardProgramListItem): void {
    const slug = rewardProgramTypeToSlug(program.type);
    if (program.type === 'CASHBACK') {
      this.router.navigate(['/bonus-program', 'create', slug, program.uuid, 'steps', 1]);
    } else {
      this.router.navigate(['/bonus-program', 'create', slug, program.uuid]);
    }
  }
}
