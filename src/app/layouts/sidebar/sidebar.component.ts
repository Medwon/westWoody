import { Component, Input, Output, EventEmitter, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconButtonComponent } from '../../shared/components/icon-button/icon-button.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { LinkComponent } from '../../shared/components/link/link.component';
import { TypographyComponent } from '../../shared/components/typography/typography.component';

export interface SidebarMenuItem {
  label: string;
  icon: string; // Эмодзи или текст иконки
  route: string;
  exact?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IconButtonComponent,
    LinkComponent,
    TypographyComponent
  ],
  template: `
    <!-- Overlay для закрытого sidebar на мобильных -->
    <div 
      class="sidebar-overlay" 
      *ngIf="isClosed() && isMobile"
      (click)="openSidebar()">
    </div>

    <div class="sidebar-container" [class.sidebar-collapsed]="isCollapsed()" [class.sidebar-closed]="isClosed()">
      <nav class="sidebar" [class.collapsed]="isCollapsed()" [class.closed]="isClosed()">
        <!-- Header с hamburger menu и логотипом -->
        <div class="sidebar-header">
          <app-icon-button
            icon="☰"
            iconButtonType="ghost"
            size="small"
            (onClick)="toggleClosed()"
            class="menu-toggle-btn"
            [title]="isClosed() ? 'Открыть меню' : 'Закрыть меню'">
          </app-icon-button>
          <div class="sidebar-logo" *ngIf="!isCollapsed() && !isClosed()">
            <app-link routerLink="/home" [noUnderline]="true">
              <app-typography variant="h5" class="logo-text">{{ logoText }}</app-typography>
            </app-link>
          </div>
        </div>

        <!-- Кнопка Create -->
        <div class="sidebar-create" *ngIf="!isCollapsed() && !isClosed()">
          <button class="create-btn" (click)="onCreateClick()">
            <span class="create-icon">+</span>
            <span class="create-label">{{ createButtonLabel }}</span>
          </button>
        </div>
        <div class="sidebar-create-collapsed" *ngIf="isCollapsed() && !isClosed()">
          <app-icon-button
            icon="+"
            iconButtonType="ghost"
            size="large"
            (onClick)="onCreateClick()">
          </app-icon-button>
        </div>

        <!-- Навигационное меню -->
        <ul class="sidebar-nav" *ngIf="!isClosed()">
          <li *ngFor="let item of menuItems">
            <a
              [routerLink]="item.route"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{exact: item.exact !== false}"
              (click)="onMenuItemClick()"
              [title]="isCollapsed() ? item.label : ''"
              class="nav-link"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-label" *ngIf="!isCollapsed()">{{ item.label }}</span>
              <span class="nav-active-indicator"></span>
            </a>
          </li>
        </ul>

        <!-- Footer (если нужен) -->
        <div class="sidebar-footer" *ngIf="showFooter && !isCollapsed()">
          <div class="footer-content">
            <ng-content select="[sidebarFooter]"></ng-content>
          </div>
        </div>
      </nav>

      <div class="sidebar-content">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .sidebar-container {
      display: flex;
      height: 100vh;
      overflow-x: hidden;
    }

    .sidebar {
      width: 240px;
      background: #ffffff;
      border-right: 1px solid #e5e7eb;
      height: 100vh;
      position: fixed;
      left: 0;
      top: 0;
      display: flex;
      flex-direction: column;
      transition: width 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
      z-index: 100;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .sidebar.collapsed {
      width: 64px;
    }

    .sidebar.closed {
      transform: translateX(-100%);
    }

    @media (min-width: 769px) {
      /* На десктопе sidebar всегда виден */
      .sidebar.closed {
        transform: translateX(0);
        width: 64px;
      }
      
      .sidebar-container.sidebar-closed .sidebar-content {
        margin-left: 64px;
      }
    }

    /* Header */
    .sidebar-header {
      height: 64px;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 16px;
      overflow-x: hidden;

      border-bottom: 1px solid #e5e7eb;
    }

    .menu-toggle-btn {
      flex-shrink: 0;
    }

    .sidebar-logo {
      flex: 1;
      min-width: 0;
    }

    .logo-text {
      color: var(--logo-color, #007bff);
      font-weight: 600;
      letter-spacing: -0.02em;
    }

    /* Create Button */
    .sidebar-create {
      padding: 12px;
    }

    .sidebar-create-collapsed {
      padding: 12px;
      display: flex;
      justify-content: center;
    }

    .sidebar-create-collapsed app-icon-button {
      width: 44px;
      height: 44px;
    }

    :host ::ng-deep .sidebar-create-collapsed .icon-button {
      width: 44px;
      height: 44px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--create-btn-bg, #f3f4f6) !important;
      border: 1px solid var(--create-btn-border, #e5e7eb) !important;
    }

    :host ::ng-deep .sidebar-create-collapsed .icon-button .icon-content {
      color: var(--create-icon-color, var(--primary-color, #15803d)) !important;
    }

    :host ::ng-deep .sidebar-create-collapsed .icon-button:hover {
      background-color: var(--create-btn-bg-hover, #e5e7eb) !important;
    }

    .create-btn {
      width: 100%;
      height: 44px;
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: flex-start;
      padding: 12px;
      border-radius: 8px;
      background-color: var(--create-btn-bg, #f3f4f6);
      border: 1px solid var(--create-btn-border, #e5e7eb);
      color: #1f2937;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.15s ease;
      box-sizing: border-box;
    }

    .create-btn:hover {
      background-color: var(--create-btn-bg-hover, #e5e7eb);
    }

    .create-btn:active {
      background-color: #d1d5db;
    }

    .create-icon {
      font-size: 24px;
      line-height: 1;
      color: var(--create-icon-color, var(--primary-color, #007bff));
      font-weight: 300;
    }

    /* Плюсик в закрытом состоянии (в IconButton) */
    .sidebar-create-collapsed .icon-content {
      color: #ffffff;
    }

    .create-label {
      font-size: 0.875rem;
      font-weight: 500;
    }

    /* Navigation */
    .sidebar-nav {
      list-style: none;
      padding: 8px 0;
      margin: 0;
      flex: 1;
      overflow-y: auto;
    }

    .sidebar-nav li {
      margin: 0;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      text-decoration: none;
      color: #6b7280;
      transition: all 0.15s ease;
      position: relative;
      min-height: 40px;
    }

    .nav-link:hover {
      background-color: #f9fafb;
      color: #1f2937;
    }

    .nav-link.active {
      background-color: var(--sidebar-active-bg, #f3f4f6);
      color: var(--sidebar-active-text, #1f2937);
      font-weight: 600;
    }

    .nav-link.active .nav-active-indicator {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 20px;
      background-color: var(--sidebar-active-indicator, var(--primary-color, #007bff));
      border-radius: 2px 0 0 2px;
    }

    .nav-icon {
      font-size: 20px;
      min-width: 20px;
      text-align: center;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-label {
      font-size: 0.875rem;
      font-weight: 500;
      white-space: nowrap;
      flex: 1;
    }

    .sidebar.collapsed .nav-link {
      justify-content: center;
      padding: 12px;
    }

    .sidebar.collapsed .nav-label,
    .sidebar.collapsed .sidebar-logo,
    .sidebar.collapsed .sidebar-create {
      display: none;
    }

    .sidebar.collapsed .nav-active-indicator {
      display: none;
    }

    @media (max-width: 768px) {
      .sidebar.closed .sidebar-logo,
      .sidebar.closed .sidebar-create,
      .sidebar.closed .sidebar-nav {
        display: none;
      }
    }

    /* Footer */
    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid #e5e7eb;
    }

    .footer-content {
      width: 100%;
    }

    /* Overlay */
    .sidebar-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 99;
      backdrop-filter: blur(2px);
    }

    /* Content */
    .sidebar-content {
      flex: 1;
      margin-left: 240px;
      transition: margin-left 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
      will-change: margin-left;
      overflow-x: hidden;
      width: calc(100vw - 240px);
      max-width: calc(100vw - 240px);
    }

    .sidebar-container.sidebar-collapsed .sidebar-content {
      margin-left: 64px;
      width: calc(100vw - 64px);
      max-width: calc(100vw - 64px);
    }

    .sidebar-container.sidebar-closed .sidebar-content {
      margin-left: 0;
      width: 100vw;
      max-width: 100vw;
    }

    /* Scrollbar */
    .sidebar::-webkit-scrollbar {
      width: 6px;
    }

    .sidebar::-webkit-scrollbar-track {
      background: transparent;
    }

    .sidebar::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 3px;
    }

    .sidebar::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }

    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
      }

      .sidebar:not(.closed) {
        transform: translateX(0);
      }

      .sidebar-content {
        margin-left: 0;
        width: 100vw;
        max-width: 100vw;
      }

      .sidebar-container.sidebar-closed .sidebar-content {
        margin-left: 0;
        width: 100vw;
        max-width: 100vw;
      }
    }
  `]
})
export class SidebarComponent {
  isCollapsed = signal(false);
  isClosed = signal(false);
  isMobile = false;
  
  @Input() menuItems: SidebarMenuItem[] = [
    { label: 'Главная', icon: '🧭', route: '/home', exact: true },
    { label: 'Соревнования', icon: '🏆', route: '/competitions' },
    { label: 'Наборы данных', icon: '📊', route: '/datasets' },
    { label: 'Модели', icon: '🔗', route: '/models' },
    { label: 'Бенчмарки', icon: '📈', route: '/benchmarks' },
  ];

  @Input() logoText = 'westwood';
  @Input() createButtonLabel = 'Создать';
  @Input() showFooter = false;

  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() closedChange = new EventEmitter<boolean>();
  @Output() createClick = new EventEmitter<void>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.checkMobile();
      
      window.addEventListener('resize', () => {
        this.checkMobile();
      });
    }

    effect(() => {
      this.collapsedChange.emit(this.isCollapsed());
      this.closedChange.emit(this.isClosed());
    });
  }

  private checkMobile(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 768;
    
    // На мобильных закрываем sidebar по умолчанию, на десктопе открываем
    if (this.isMobile && !wasMobile) {
      this.isClosed.set(true);
    } else if (!this.isMobile && wasMobile) {
      this.isClosed.set(false);
    }
  }

  toggleSidebar(): void {
    this.isCollapsed.update(val => !val);
  }

  toggleClosed(): void {
    if (this.isMobile) {
      // На мобильных переключаем между открытым/закрытым
      this.isClosed.update(val => !val);
    } else {
      // На десктопе переключаем между развернутым/свернутым
      this.isCollapsed.update(val => !val);
      this.isClosed.set(false); // Убеждаемся что sidebar виден
    }
  }

  openSidebar(): void {
    this.isClosed.set(false);
  }

  closeSidebar(): void {
    this.isClosed.set(true);
  }

  onMenuItemClick(): void {
    // Закрываем sidebar на мобильных устройствах после клика
    if (this.isMobile) {
      this.closeSidebar();
    }
  }

  onCreateClick(): void {
    this.createClick.emit();
  }
}
