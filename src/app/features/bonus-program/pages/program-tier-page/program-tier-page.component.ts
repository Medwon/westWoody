import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RewardProgramsService } from '../../../../core/services/reward-programs.service';
import { PageHeaderService } from '../../../../core/services/page-header.service';
import {
  RewardProgramResponse,
  CashbackTierResponse,
  PagedTieredClientsResponse
} from '../../../../core/models/reward-program.model';
import { NotFoundStateComponent } from '../../../../shared/components/not-found-state/not-found-state.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/select/select.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

const PAGE_SIZE_OPTIONS = [15, 30, 50, 100];

@Component({
  selector: 'app-program-tier-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NotFoundStateComponent, LoaderComponent, SelectComponent, PaginationComponent, ButtonComponent],
  template: `
    <div class="page-shell">
      @if (loading()) {
        <div class="loading-state">
          <app-loader [visible]="true" [overlay]="false" type="logo" size="large"></app-loader>
          <p>Loading…</p>
        </div>
      } @else if (notFound()) {
        <app-not-found-state
          [title]="'Tier not found'"
          [description]="'This tier does not exist for this program or the program is not available.'"
          [backLink]="programBackUrl()"
          backText="Back to program">
        </app-not-found-state>
      } @else {
        <header class="tier-header">
          <a [routerLink]="programViewLink()" class="back-link">← Program</a>
          <h1 class="tier-title">{{ tier()?.name }}</h1>
          <p class="tier-subtitle">{{ program()?.name }}</p>
        </header>

        <!-- Tier at a glance -->
        <section class="glance-section card">
          <h2 class="glance-title">Tier at a glance</h2>
          <div class="glance-grid" *ngIf="tier() as t">
            <div class="glance-item glance-item-spend">
              <span class="glance-label">Spend range</span>
              <span class="glance-value glance-value-nowrap">{{ formatTierRange(t) }}</span>
            </div>
            <div class="glance-item">
              <span class="glance-label">Clients in tier</span>
              <span class="glance-value">{{ tieredData()?.totalElements ?? 0 }}</span>
            </div>
            <div class="glance-item" *ngIf="t.extraEarningPercent != null">
              <span class="glance-label">Extra earning</span>
              <span class="glance-value">{{ t.extraEarningPercent }}%</span>
            </div>
          </div>
        </section>

        <!-- Search and sort (same layout as clients page) -->
        <div class="toolbar">
          <div class="filter-group search-group">
            <div class="search-input-wrapper search-input-unified">
              <svg viewBox="0 0 24 24" fill="none" class="search-icon">
                <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="1.5"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              <input
                type="text"
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
                (keydown.enter)="applyFilters()"
                placeholder="Поиск по имени или телефону..."
                class="filter-input">
              <button
                type="button"
                class="search-clear-btn"
                *ngIf="searchQuery()?.trim()"
                (click)="onClearSearch()">
                ×
              </button>
            </div>
          </div>
          <div class="filters-actions">
            <app-button buttonType="primary" size="medium" (onClick)="applyFilters()">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="1.5"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              Поиск
            </app-button>
            <app-button
              *ngIf="hasActiveFilters()"
              buttonType="secondary"
              size="medium"
              (onClick)="clearFilters()">
              Сбросить
            </app-button>
          </div>
          <div class="filter-group sort-group">
            <app-select
              label="Сортировка:"
              [options]="sortOptions"
              [(ngModel)]="sortValue"
              (ngModelChange)="onSortValueChange($event)"
              placeholder="Сортировка">
            </app-select>
            <button type="button" class="sort-direction-btn" (click)="toggleSortDirection()">
              <svg viewBox="0 0 24 24" fill="none" [class.desc]="sortDirection() === 'desc'">
                <path d="M12 5v14M19 12l-7 7-7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Table (same layout as clients / payments: no card, pagination bar below) -->
        <div class="table-and-pagination-wrapper">
          @if (loadingClients()) {
            <div class="table-loading">
              <app-loader [visible]="true" [overlay]="false" type="spinner" size="small"></app-loader>
            </div>
          } @else {
            <div class="table-container">
              <table class="tier-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Contact</th>
                    <th>Spend (program period)</th>
                    <th>Progress to next tier</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @if (tieredData()?.content?.length) {
                    @for (row of tieredData()!.content; track row.clientUuid) {
                      <tr class="tier-row">
                        <td>
                          <a [routerLink]="['/clients', row.clientUuid]" class="client-link">{{ row.clientName }}</a>
                        </td>
                        <td>{{ row.phone || '—' }}</td>
                        <td>{{ row.programPeriodSpend | number:'1.0-0' }} ₸</td>
                        <td>
                          @if (row.percentToNextTier != null) {
                            <div class="progress-cell">
                              <div class="progress-bar-track">
                                <div class="progress-bar-fill" [style.width.%]="row.percentToNextTier"></div>
                              </div>
                              <span class="progress-text">{{ row.percentToNextTier | number:'1.0-1' }}%</span>
                              @if (row.nextTierName) {
                                <span class="next-tier-text">→ {{ row.nextTierName }}</span>
                              }
                            </div>
                          } @else {
                            <span class="top-tier-text">Top tier</span>
                          }
                        </td>
                        <td>
                          <a [routerLink]="['/clients', row.clientUuid]" class="link-profile">Profile</a>
                        </td>
                      </tr>
                    }
                  } @else {
                    <tr class="empty-row">
                      <td colspan="5" class="empty-state-cell">
                        <div class="empty-state">
                          <span>No clients in this tier yet. Tiering is based on spend during the program period.</span>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            @if (!loadingClients() && (tieredData()?.totalElements ?? 0) > 0) {
              <div class="pagination-container">
                <div class="pagination-left">
                  <div class="pagination-info">
                    <span>Показано {{ (currentPage() * pageSize) + 1 }}-{{ Math.min((currentPage() + 1) * pageSize, tieredData()!.totalElements) }} из {{ tieredData()!.totalElements }}</span>
                  </div>
                  <div class="page-size-filter-section">
                    <label class="page-size-label">Строк на странице:</label>
                    <select [(ngModel)]="pageSize" (change)="onPageSizeChange()" class="page-size-select">
                      @for (opt of pageSizeOptions; track opt) {
                        <option [value]="opt">{{ opt }}</option>
                      }
                    </select>
                  </div>
                </div>
                @if (getTotalPages() > 1) {
                  <div class="pagination-right">
                    <app-pagination
                      [currentPage]="currentPage() + 1"
                      [totalPages]="getTotalPages()"
                      (pageChange)="onPageChange($event)">
                    </app-pagination>
                  </div>
                }
              </div>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-shell { max-width: 1400px; margin: 0 auto; padding: 0 1.5rem 3rem; }
    .loading-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 1rem; padding: 4rem 0; color: #64748b;
    }
    .tier-header { margin-bottom: 1.5rem; }
    .back-link {
      display: inline-block; font-size: 0.875rem; color: var(--primary-color, #15803d);
      text-decoration: none; margin-bottom: 0.5rem;
    }
    .back-link:hover { text-decoration: underline; }
    .tier-title { font-size: 1.75rem; font-weight: 700; color: #0f172a; margin: 0 0 0.25rem 0; }
    .tier-subtitle { font-size: 0.9375rem; color: #64748b; margin: 0; }

    .card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.25rem; margin-bottom: 1.25rem; }
    .glance-title { font-size: 0.75rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 1rem 0; }
    .glance-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; }
    .glance-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .glance-item-spend { grid-column: 1 / -1; width: 100%; }
    .glance-label { font-size: 0.75rem; color: #64748b; }
    .glance-value { font-size: 1rem; font-weight: 600; color: #0f172a; }
    .glance-value-nowrap { white-space: nowrap; width: 100%; }

    .toolbar {
      display: flex; align-items: flex-end; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;
      background: #fff; border-radius: 16px; padding: 1.25rem; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .filter-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .search-group { flex: 1; min-width: 260px; }
    .search-input-wrapper { position: relative; display: flex; align-items: center; }
    .search-input-unified .filter-input { padding-right: 2.25rem; }
    .search-icon { position: absolute; left: 12px; width: 18px; height: 18px; color: #94a3b8; pointer-events: none; }
    .filter-input {
      width: 100%; padding: 0.625rem 0.875rem 0.625rem 2.5rem;
      border: 1.5px solid var(--color-input-border, #cbd5e1); border-radius: 10px; font-size: 0.9rem;
      background: #f8fafc; color: #1f2937; transition: all 0.2s;
    }
    .filter-input:hover { border-color: var(--color-input-border-hover, #94a3b8); }
    .filter-input:focus {
      outline: none; border-color: var(--color-input-border-focus, #15803d); background: #fff;
      box-shadow: 0 0 0 3px var(--color-input-shadow-focus, rgba(22, 163, 74, 0.1));
    }
    .filter-input::placeholder { color: #94a3b8; }
    .search-clear-btn {
      position: absolute; right: 10px; width: 20px; height: 20px; border-radius: 999px; border: none;
      background: transparent; color: #94a3b8; font-size: 16px; line-height: 1; cursor: pointer;
      display: flex; align-items: center; justify-content: center; padding: 0;
    }
    .search-clear-btn:hover { color: #64748b; background: #e5e7eb; }
    .filters-actions { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
    .filters-actions app-button { min-width: 110px; }
    .filters-actions app-button svg { width: 14px; height: 14px; }
    .sort-group {
      display: flex; flex-direction: row; align-items: center; gap: 0.5rem;
    }
    .sort-group ::ng-deep .select-wrapper { width: auto; min-width: 180px; gap: 0.35rem; }
    .sort-group ::ng-deep .select-label { font-size: 0.75rem; font-weight: 600; color: #64748b; }
    .sort-group ::ng-deep .select-trigger { height: 36px; min-height: 36px; padding: 0.5rem 2rem 0.5rem 0.75rem; }
    .sort-group ::ng-deep .select-trigger:hover { border-color: #cbd5e1; }
    .sort-group ::ng-deep .select-trigger:focus,
    .sort-group ::ng-deep .select-trigger.open { outline: none; border-color: #22c55e; box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.15); }
    .sort-direction-btn {
      width: 36px; height: 36px; border: 1.5px solid #e2e8f0; border-radius: 10px; background: #fff;
      color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; flex-shrink: 0; margin-top: auto;
    }
    .sort-direction-btn svg { width: 18px; height: 18px; transition: transform 0.2s; }
    .sort-direction-btn svg.desc { transform: rotate(180deg); }
    .sort-direction-btn:hover { border-color: #22c55e; color: #16A34A; }

    .table-loading { padding: 2rem; text-align: center; }
    .table-container {
      background: #fff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border: 1px solid #e5e7eb; overflow: hidden;
    }
    .tier-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .tier-table th {
      padding: 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #64748b;
      text-transform: uppercase; letter-spacing: 0.5px; background: #f8fafc; border-bottom: 1px solid #e5e7eb;
    }
    .tier-table td { padding: 1rem; border-bottom: 1px solid #f1f5f9; color: #0f172a; }
    .tier-row { transition: background 0.15s; }
    .tier-row:hover { background: #f8fafc; }
    .tier-row:last-child td { border-bottom: none; }
    .client-link { font-weight: 600; color: var(--primary-color, #15803d); text-decoration: none; }
    .client-link:hover { text-decoration: underline; }
    .progress-cell { display: flex; align-items: center; gap: 0.5rem; }
    .progress-bar-track { width: 80px; height: 6px; border-radius: 3px; background: #e2e8f0; overflow: hidden; }
    .progress-bar-fill { height: 100%; border-radius: 3px; background: var(--primary-color, #15803d); }
    .progress-text { font-weight: 600; white-space: nowrap; }
    .next-tier-text { font-size: 0.75rem; color: #64748b; }
    .top-tier-text { font-size: 0.8125rem; color: #64748b; font-style: italic; }
    .link-profile { font-size: 0.8125rem; font-weight: 600; color: var(--primary-color, #15803d); text-decoration: none; }
    .link-profile:hover { text-decoration: underline; }
    .table-and-pagination-wrapper { display: flex; flex-direction: column; gap: 0; }
    .empty-row td.empty-state-cell { padding: 0; border-bottom: none; vertical-align: middle; }
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; color: #64748b; }
    .empty-state span { font-size: 1rem; text-align: center; }
    .pagination-container {
      display: flex; flex-direction: row; flex-wrap: nowrap; justify-content: space-between; align-items: center;
      width: 100%; padding: 1rem; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      gap: 1rem; margin-top: 1rem; box-sizing: border-box;
    }
    .pagination-left { display: flex; flex-direction: row; align-items: center; gap: 1.5rem; flex-shrink: 0; }
    .pagination-right { display: flex; align-items: center; flex-shrink: 0; margin-left: auto; }
    .pagination-info { font-size: 0.875rem; color: #64748b; font-weight: 500; }
    .page-size-filter-section { display: flex; align-items: center; gap: 0.75rem; }
    .page-size-label { font-size: 0.875rem; font-weight: 600; color: #475569; }
    .page-size-select {
      padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.875rem;
      background: white; color: #1f2937; cursor: pointer; outline: none; transition: all 0.2s;
    }
    .page-size-select:hover { border-color: #94a3b8; }
    .page-size-select:focus { border-color: var(--primary-color, #15803d); box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1); }
  `]
})
export class ProgramTierPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private rewardService = inject(RewardProgramsService);
  private pageHeaderService = inject(PageHeaderService);

  private programUuid = '';
  private tierNameParam = '';

  loading = signal(true);
  notFound = signal(false);
  loadingClients = signal(false);
  program = signal<RewardProgramResponse | null>(null);
  tier = signal<CashbackTierResponse | null>(null);
  tieredData = signal<PagedTieredClientsResponse | null>(null);
  searchQuery = signal('');
  currentPage = signal(0);
  sortValue = 'programPeriodSpend,desc';

  sortOptions: SelectOption[] = [
    { value: 'programPeriodSpend,desc', label: 'Spending' },
    { value: 'percentToNextTier,desc', label: '% to next level' }
  ];

  sortDirection = signal<'asc' | 'desc'>('desc');
  pageSize = 15;
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly Math = Math;

  ngOnInit(): void {
    const uuid = this.route.snapshot.paramMap.get('uuid') ?? '';
    const tierName = this.route.snapshot.paramMap.get('tierName') ?? '';
    if (!uuid || !tierName) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    this.programUuid = uuid;
    this.tierNameParam = decodeURIComponent(tierName);
    this.rewardService.getProgram(uuid).subscribe({
      next: (p) => {
        if (p.status === 'DRAFT') {
          this.notFound.set(true);
          this.loading.set(false);
          return;
        }
        this.program.set(p);
        const t = p.cashbackTiers?.find(
          (c) => c.name.toLowerCase() === this.tierNameParam.toLowerCase()
        );
        if (!t) {
          this.notFound.set(true);
          this.loading.set(false);
          return;
        }
        this.tier.set(t);
        this.loading.set(false);
        this.setPageHeader();
        this.loadClients();
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      }
    });
  }

  private setPageHeader(): void {
    const p = this.program();
    const t = this.tier();
    if (!p || !t) return;
    this.pageHeaderService.setPageHeader('Tier View', [
      { label: 'Program View', route: '/reward-programs/view/' + p.uuid + '/tiers' },
      { label: 'Tier View' }
    ]);
  }

  programViewLink(): string[] {
    const u = this.program()?.uuid;
    return u ? ['/reward-programs', 'view', u, 'tiers'] : ['/reward-programs'];
  }

  programBackUrl(): string {
    const u = this.program()?.uuid ?? this.programUuid;
    return u ? `/reward-programs/view/${u}/tiers` : '/reward-programs';
  }

  formatTierRange(t: CashbackTierResponse): string {
    const min = t.minAmount.toLocaleString('en-US') + ' ₸';
    const max = t.maxAmount != null ? t.maxAmount.toLocaleString('en-US') + ' ₸' : 'No cap';
    return `${min} – ${max}`;
  }

  applyFilters(): void {
    this.currentPage.set(0);
    this.loadClients();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.sortValue = 'programPeriodSpend,desc';
    this.sortDirection.set('desc');
    this.currentPage.set(0);
    this.loadClients();
  }

  hasActiveFilters(): boolean {
    return this.searchQuery().trim() !== '' || this.sortValue !== 'programPeriodSpend,desc';
  }

  onClearSearch(): void {
    this.searchQuery.set('');
  }

  toggleSortDirection(): void {
    const [field] = this.sortValue.split(',');
    const next = this.sortDirection() === 'asc' ? 'desc' : 'asc';
    this.sortDirection.set(next);
    this.sortValue = `${field},${next}`;
    this.currentPage.set(0);
    this.loadClients();
  }

  onSortValueChange(value: string): void {
    this.sortValue = value;
    const dir = value.endsWith(',desc') ? 'desc' : 'asc';
    this.sortDirection.set(dir);
    this.currentPage.set(0);
    this.loadClients();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadClients();
  }

  getTotalPages(): number {
    return this.tieredData()?.totalPages ?? 0;
  }

  onPageSizeChange(): void {
    this.currentPage.set(0);
    this.loadClients();
  }

  onPageChange(pageOneBased: number): void {
    this.goToPage(pageOneBased - 1);
  }

  /**
   * Backend applies search and searchPhone as AND. Send query to only one param:
   * looks like phone (digits, +, -, spaces) → searchPhone (normalized like on Clients page); otherwise → search (name).
   */
  private resolveSearchParams(query: string): { search?: string; searchPhone?: string } {
    const q = query.trim();
    if (!q) return {};
    const normalized = q.replace(/\s/g, '');
    const looksLikePhone = /^\+?[\d\-]+$/.test(normalized) && /\d/.test(normalized);
    if (looksLikePhone) return { searchPhone: this.normalizePhone(q) };
    return { search: q };
  }

  /** Same as Clients page: 8 → +7, 7 → +7, +7 → +7 */
  private normalizePhone(input: string): string {
    let digits = input.replace(/\D/g, '');
    if (!digits) return '';
    if (digits[0] === '8') {
      digits = '7' + digits.slice(1);
    }
    if (digits.length === 10 && digits[0] !== '7') {
      digits = '7' + digits;
    }
    return '+' + digits;
  }

  private loadClients(): void {
    const uuid = this.program()?.uuid;
    if (!uuid) return;
    this.loadingClients.set(true);
    const q = this.searchQuery().trim();
    const { search, searchPhone } = this.resolveSearchParams(q);
    this.rewardService.getTieredClients(
      uuid,
      this.currentPage(),
      this.pageSize,
      this.tierNameParam,
      search,
      searchPhone,
      this.sortValue
    ).subscribe({
      next: (data) => {
        this.tieredData.set(data);
        this.loadingClients.set(false);
      },
      error: () => this.loadingClients.set(false)
    });
  }
}
