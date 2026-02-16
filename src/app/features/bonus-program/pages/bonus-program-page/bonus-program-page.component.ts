import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PageHeaderService } from '../../../../core/services/page-header.service';

/** Mock program row for UI - replace with API later */
interface ProgramRow {
  id: string;
  name: string;
  type: string;       // e.g. "Acquisition", "Growth", "Event"
  reward: string;     // e.g. "3000 bonus", "5% cashback"
  customers: string;  // e.g. "45% of new customers"
  status: 'Active' | 'Draft' | 'Scheduled' | 'Archived';
  statusDetail?: string; // e.g. "Starts tomorrow"
  icon: 'gift' | 'referral' | 'cake' | 'percent' | 'clock';
}

type FilterTab = 'All' | 'Active' | 'Draft' | 'Scheduled' | 'Archived';

@Component({
  selector: 'app-bonus-program-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-wrapper">
      <div class="programs-container">
        <!-- Actions only - breadcrumb & title come from layout PageHeader -->
        <div class="header-actions-row">
          <a routerLink="/bonus-program/programs" class="btn-create-program">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Create program
          </a>
        </div>

        <!-- Tabs + count -->
        <div class="tabs-row">
          <div class="tabs">
            <button type="button" class="tab" [class.active]="activeTab === 'All'" (click)="activeTab = 'All'">All</button>
            <button type="button" class="tab" [class.active]="activeTab === 'Active'" (click)="activeTab = 'Active'">Active</button>
            <button type="button" class="tab" [class.active]="activeTab === 'Draft'" (click)="activeTab = 'Draft'">Draft</button>
            <button type="button" class="tab" [class.active]="activeTab === 'Scheduled'" (click)="activeTab = 'Scheduled'">Scheduled</button>
            <button type="button" class="tab" [class.active]="activeTab === 'Archived'" (click)="activeTab = 'Archived'">Archived</button>
          </div>
          <span class="tab-count">{{ filteredPrograms.length }}</span>
        </div>

        <!-- Table -->
        <div class="table-wrap">
          <table class="programs-table">
            <colgroup>
              <col style="width:40%">
              <col style="width:15%">
              <col style="width:25%">
              <col style="width:15%">
              <col style="width:5%">
            </colgroup>
            <thead>
              <tr>
                <th>
                  <div class="cell-flex">
                    <label class="checkbox-wrap">
                      <input type="checkbox" [(ngModel)]="selectAll" (change)="toggleSelectAll()">
                      <span class="checkmark"></span>
                    </label>
                    <span>Campaign</span>
                  </div>
                </th>
                <th>Reward</th>
                <th>Customers</th>
                <th>Status <span class="sort-indicator">▾</span></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let program of filteredPrograms" class="program-row" (click)="goToProgram(program)">
                <td>
                  <div class="cell-flex">
                    <label class="checkbox-wrap" (click)="$event.stopPropagation()">
                      <input type="checkbox" [checked]="selectedIds.has(program.id)" (change)="toggleSelect(program.id)">
                      <span class="checkmark"></span>
                    </label>
                    <div class="program-icon" [class.grey]="program.status !== 'Active'">
                      <ng-container [ngSwitch]="program.icon">
                        <svg *ngSwitchCase="'gift'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 12v9H4v-9"/><rect x="2" y="7" width="20" height="5" rx="1"/><path d="M12 22V7"/><path d="M12 7c-2-2-4-2.5-4-4.5a2 2 0 0 1 4 0c0 1.5-2 2-4 4.5"/><path d="M12 7c2-2 4-2.5 4-4.5a2 2 0 0 0-4 0c0 1.5 2 2 4 4.5"/></svg>
                        <svg *ngSwitchCase="'referral'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.5 13.5l7 4M15.5 6.5l-7 4"/></svg>
                        <svg *ngSwitchCase="'cake'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1z"/><path d="M3 16h18"/><path d="M12 12V9m-4 3V10m8 2V10"/><circle cx="8" cy="6" r="1"/><circle cx="12" cy="6" r="1"/><circle cx="16" cy="6" r="1"/></svg>
                        <svg *ngSwitchCase="'percent'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="9" r="2"/><circle cx="15" cy="15" r="2"/><path d="M5 19L19 5"/></svg>
                        <svg *ngSwitchCase="'clock'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                      </ng-container>
                    </div>
                    <div class="program-info">
                      <span class="program-name">{{ program.name }}</span>
                      <span class="program-type">Type: {{ program.type }}</span>
                    </div>
                  </div>
                </td>
                <td>{{ program.reward }}</td>
                <td>{{ program.customers }}</td>
                <td>
                  <span *ngIf="program.statusDetail" class="status-detail">{{ program.statusDetail }}</span>
                  <span class="status-pill" [class.active]="program.status === 'Active'" [class.scheduled]="program.status === 'Scheduled'">{{ program.status }}</span>
                </td>
                <td class="td-action">
                  <svg class="row-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination">
          <button type="button" class="page-btn" [disabled]="currentPage <= 1" aria-label="Previous">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span class="page-info">{{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, filteredPrograms.length) }} of {{ filteredPrograms.length }}</span>
          <button type="button" class="page-btn" [disabled]="currentPage * pageSize >= filteredPrograms.length" aria-label="Next">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .page-wrapper { min-height: 100%; margin: -2rem; padding: 2rem; background: #f8fafc; }
    .programs-container { max-width: 100%; margin: 0 auto; }

    .header-actions-row { display: flex; align-items: center; justify-content: flex-end; margin-bottom: 1rem; }
    .btn-create-program { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: #16A34A; color: white; border-radius: 8px; font-size: 0.9rem; font-weight: 600; text-decoration: none; transition: background 0.2s; }
    .btn-create-program:hover { background: #15803d; color: white; }
    .btn-icon { width: 18px; height: 18px; }

    .tabs-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; gap: 1rem; flex-wrap: wrap; }
    .tabs { display: flex; gap: 0; background: #f1f5f9; border-radius: 8px; padding: 2px; }
    .tab { padding: 0.4rem 1rem; border: none; background: transparent; border-radius: 6px; font-size: 0.875rem; font-weight: 500; color: #64748b; cursor: pointer; transition: all 0.2s; }
    .tab:hover { color: #475569; }
    .tab.active { background: #16A34A; color: white; }
    .tab-count { font-size: 0.875rem; color: #64748b; }

    .table-wrap { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .programs-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .programs-table th,
    .programs-table td { text-align: left; padding: 0.75rem 1rem; vertical-align: middle; }
    .programs-table th { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .programs-table td { padding: 0.875rem 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; color: #475569; }
    .program-row { cursor: pointer; transition: background 0.15s; }
    .program-row:hover { background: #f8fafc; }
    .program-row:last-child td { border-bottom: none; }

    /* Inner flex wrapper for cells that need horizontal layout (campaign column) */
    .cell-flex { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }

    .checkbox-wrap { display: inline-flex; align-items: center; cursor: pointer; flex-shrink: 0; }
    .checkbox-wrap input { position: absolute; opacity: 0; width: 18px; height: 18px; cursor: pointer; }
    .checkmark { width: 18px; height: 18px; border: 2px solid #cbd5e1; border-radius: 4px; flex-shrink: 0; }
    .checkbox-wrap input:checked + .checkmark { background: #16A34A; border-color: #16A34A; }
    .checkbox-wrap input:checked + .checkmark::after { content: ''; display: block; width: 5px; height: 10px; border: solid white; border-width: 0 2px 2px 0; margin: 2px 0 0 5px; transform: rotate(45deg); }
    .program-icon { width: 40px; height: 40px; border-radius: 8px; background: #dcfce7; color: #16A34A; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .program-icon.grey { background: #f1f5f9; color: #94a3b8; }
    .program-icon svg { width: 22px; height: 22px; }
    .program-info { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; overflow: hidden; }
    .program-name { font-weight: 600; color: #0f172a; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .program-type { font-size: 0.8rem; color: #64748b; }

    .status-detail { display: block; font-size: 0.8rem; color: #64748b; margin-bottom: 0.15rem; }
    .status-pill { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .status-pill.active { background: #dcfce7; color: #16A34A; }
    .status-pill.scheduled { background: #f1f5f9; color: #64748b; }
    .status-pill:not(.active):not(.scheduled) { background: #f1f5f9; color: #64748b; }
    .sort-indicator { margin-left: 0.25rem; opacity: 0.6; font-size: 0.65rem; }
    .td-action { text-align: right !important; }
    .row-arrow { width: 20px; height: 20px; color: #94a3b8; }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1.25rem; }
    .page-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; border-radius: 8px; background: white; color: #475569; cursor: pointer; }
    .page-btn:hover:not(:disabled) { background: #f8fafc; border-color: #16A34A; color: #16A34A; }
    .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .page-btn svg { width: 18px; height: 18px; }
    .page-info { font-size: 0.875rem; color: #64748b; }
  `]
})
export class BonusProgramPageComponent implements OnInit {
  private pageHeaderService = inject(PageHeaderService);
  private router = inject(Router);

  activeTab: FilterTab = 'All';
  selectAll = false;
  selectedIds = new Set<string>();
  currentPage = 1;
  pageSize = 10;
  Math = Math;

  /** Mock data - replace with API */
  programs: ProgramRow[] = [
    { id: '1', name: 'Welcome Bonus', type: 'Acquisition', reward: 'Acquisition', customers: '3000 bonus, 45% of new customers', status: 'Active', icon: 'gift' },
    { id: '2', name: 'Referral Program', type: 'Growth', reward: 'Growth', customers: '500 bonus, 12% of customers', status: 'Active', icon: 'referral' },
    { id: '3', name: 'Birthday Reward', type: 'Event', reward: 'Event', customers: '1500 bonus, 57% of active customers', status: 'Active', icon: 'cake' },
    { id: '4', name: 'Weekend Cashback', type: 'Cashback', reward: '5% cashback', customers: '5% cashback', status: 'Scheduled', statusDetail: 'Starts tomorrow', icon: 'percent' },
    { id: '5', name: 'Weekend Cashback', type: 'Cashback', reward: '5% Cashback', customers: '', status: 'Scheduled', icon: 'clock' }
  ];

  get filteredPrograms(): ProgramRow[] {
    if (this.activeTab === 'All') return this.programs;
    return this.programs.filter(p => p.status === this.activeTab);
  }

  ngOnInit(): void {
    this.pageHeaderService.setPageHeader('Reward Programs', [
      { label: 'Главная', route: '/home' },
      { label: 'Reward Programs' }
    ]);
  }

  toggleSelectAll(): void {
    if (this.selectAll) {
      this.filteredPrograms.forEach(p => this.selectedIds.add(p.id));
    } else {
      this.filteredPrograms.forEach(p => this.selectedIds.delete(p.id));
    }
  }

  toggleSelect(id: string): void {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
    this.selectAll = this.filteredPrograms.length > 0 && this.filteredPrograms.every(p => this.selectedIds.has(p.id));
  }

  goToProgram(program: ProgramRow): void {
    // Placeholder: navigate to configure when backend is ready
    // this.router.navigate(['/bonus-program', 'configure', program.id]);
  }
}
