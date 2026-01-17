import { Component, Input, Output, EventEmitter, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { IconButtonComponent } from '../../shared/components/icon-button/icon-button.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { SidebarService } from '../../core/services/sidebar.service';
import { TransactionModalService } from '../../core/services/transaction-modal.service';
import { logout } from '../../core/store/auth/auth.actions';


export interface SidebarMenuChild {
  label: string;
  iconPath: string;
  route: string;
}

export interface SidebarMenuItem {
  label: string;
  iconPath: string; // SVG path
  route?: string;
  exact?: boolean;
  children?: SidebarMenuChild[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IconButtonComponent,
    ButtonComponent
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
        <!-- Header с логотипом -->
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <a routerLink="/home" class="logo-link">
              <svg class="logo-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.8"/>
                <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="logo-text" *ngIf="!isCollapsed()">{{ logoText }}</span>
            </a>
          </div>
        </div>

        <!-- Кнопка Create -->
        <div class="sidebar-create" *ngIf="!isCollapsed() && !isClosed()">
          <app-button
            buttonType="ghost"
            size="medium"
            (onClick)="onCreateClick()"
            [tooltip]="createButtonLabel">
            <svg class="create-icon" viewBox="0 0 24 24" fill="none">
              <path d="M6 12H18M12 6V18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="create-label">{{ createButtonLabel }}</span>
          </app-button>
        </div>
        <div class="sidebar-create-collapsed" *ngIf="isCollapsed() && !isClosed()">
          <app-icon-button
            iconButtonType="ghost"
            size="large"
            (onClick)="onCreateClick()">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M6 12H18M12 6V18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </app-icon-button>
        </div>

        <!-- Навигационное меню -->
        <ul class="sidebar-nav" *ngIf="!isClosed()">
          <li *ngFor="let item of menuItems" class="nav-item" [class.has-children]="item.children?.length">
            <!-- Обычный пункт меню -->
            <a
              *ngIf="item.route && !item.children?.length"
              [routerLink]="item.route"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{exact: item.exact !== false}"
              (click)="onMenuItemClick()"
              [title]="isCollapsed() ? item.label : ''"
              class="nav-link"
            >
              <svg viewBox="0 0 24 24" fill="none" class="nav-icon" [innerHTML]="sanitizeHtml(item.iconPath)"></svg>
              <span class="nav-label" *ngIf="!isCollapsed()">{{ item.label }}</span>
            </a>
            
            <!-- Пункт с подменю -->
            <div *ngIf="item.children?.length" class="nav-dropdown">
              <!-- В свёрнутом состоянии - ссылка на первый child -->
              <a 
                *ngIf="isCollapsed()"
                [routerLink]="item.children![0].route"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{exact: false}"
                (click)="onMenuItemClick()"
                [title]="item.label"
                class="nav-link"
                [class.active]="isChildActive(item)">
                <svg viewBox="0 0 24 24" fill="none" class="nav-icon" [innerHTML]="sanitizeHtml(item.iconPath)"></svg>
              </a>
              
              <!-- В развёрнутом состоянии - dropdown -->
              <button 
                *ngIf="!isCollapsed()"
                class="nav-link nav-dropdown-toggle"
                [class.expanded]="expandedMenus[item.label]"
                [class.active]="isChildActive(item)"
                (click)="toggleDropdown(item.label)">
                <svg viewBox="0 0 24 24" fill="none" class="nav-icon" [innerHTML]="sanitizeHtml(item.iconPath)"></svg>
                <span class="nav-label">{{ item.label }}</span>
                <svg viewBox="0 0 24 24" fill="none" class="dropdown-arrow" [class.rotated]="expandedMenus[item.label]">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              
              <div class="nav-submenu" [class.open]="expandedMenus[item.label] && !isCollapsed()">
                <a
                  *ngFor="let child of item.children"
                  [routerLink]="child.route"
                  routerLinkActive="active"
                  (click)="onMenuItemClick()"
                  class="nav-sublink">
                  <svg viewBox="0 0 24 24" fill="none" class="nav-subicon" [innerHTML]="sanitizeHtml(child.iconPath)"></svg>
                  <span class="nav-sublabel">{{ child.label }}</span>
                </a>
              </div>
            </div>
          </li>
        </ul>

        <!-- Footer с действиями -->
        <div class="sidebar-footer" *ngIf="!isClosed()">
          <div class="footer-actions">
            <a routerLink="/profile" routerLinkActive="active" class="footer-link" [title]="isCollapsed() ? 'Профиль' : ''">
              <svg viewBox="0 0 24 24" fill="none" class="footer-icon">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="footer-label" *ngIf="!isCollapsed()">Профиль</span>
            </a>
            <a routerLink="/settings" routerLinkActive="active" class="footer-link" [title]="isCollapsed() ? 'Настройки' : ''">
              <svg viewBox="0 0 24 24" fill="none" class="footer-icon">
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="footer-label" *ngIf="!isCollapsed()">Настройки</span>
            </a>
            <div class="footer-bottom-row">
              <button class="footer-link logout-link" (click)="onLogoutClick()" [title]="isCollapsed() ? 'Выйти' : ''">
                <svg viewBox="0 0 24 24" fill="none" class="footer-icon">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <polyline points="16,17 21,12 16,7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="footer-label" *ngIf="!isCollapsed()">Выйти</span>
              </button>
              <button 
                class="toggle-btn" 
                (click)="toggleClosed()"
                [title]="isCollapsed() ? 'Развернуть' : 'Свернуть'">
                <svg viewBox="0 0 24 24" fill="none" class="toggle-icon" [class.rotated]="isCollapsed()">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
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
      padding: 0 16px;
      justify-content: left;
      overflow-x: hidden;
      border-bottom: 1px solid #e5e7eb;
    }

    .sidebar-logo {
      display: flex;
      justify-content: center;
    }

    .logo-link {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      text-decoration: none;
      color: inherit;
    }

    .logo-icon {
      width: 28px;
      height: 28px;
      color: #15803d;
      flex-shrink: 0;
    }

    .logo-text {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1a202c;
      letter-spacing: -0.02em;
      white-space: nowrap;
      overflow: hidden;
      transition: opacity 0.15s ease, width 0.15s ease;
    }

    .sidebar.collapsed .logo-link {
      justify-content: center;
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

    :host ::ng-deep .sidebar-create-collapsed .icon-button svg {
      width: 32px;
      height: 32px;
    }

    :host ::ng-deep .sidebar-create-collapsed .icon-button:hover {
      background-color: var(--create-btn-bg-hover, #e5e7eb) !important;
    }

    .sidebar-create app-button {
      width: 100%;
      display: block;
    }

    :host ::ng-deep .sidebar-create app-button button {
      width: 100%;
      height: 44px;
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: flex-start;
      padding: 12px;
      border-radius: 8px;
      background-color: var(--create-btn-bg, #f3f4f6) !important;
      border: 1px solid var(--create-btn-border, #e5e7eb) !important;
      color: #1f2937 !important;
      font-weight: 500;
      font-size: 0.875rem;
      box-sizing: border-box;
      overflow: hidden;
      white-space: nowrap;
    }

    :host ::ng-deep .sidebar-create app-button button:hover {
      background-color: var(--create-btn-bg-hover, #e5e7eb) !important;
    }

    :host ::ng-deep .sidebar-create app-button button:active {
      background-color: #d1d5db !important;
    }

    :host ::ng-deep .sidebar-create app-button button svg.create-icon {
      width: 32px;
      height: 32px;
      color: var(--create-icon-color, var(--primary-color, #007bff));
      flex-shrink: 0;
    }

    .create-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: inline-flex;
      align-items: center;
      line-height: 1.5;
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
      padding: 8px 12px;
      margin: 0;
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .sidebar-nav li {
      margin: 0;
      min-width: 0;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      text-decoration: none;
      color: #6b7280;
      border-radius: 8px;
      transition: all 0.15s ease;
      overflow: hidden;
      min-width: 0;
    }

    .nav-link:hover {
      background-color: #f3f4f6;
      color: #1f2937;
    }

    .nav-link.active {
      background-color: #f0fdf4;
      color: #15803d;
    }

    .nav-link.active .nav-icon {
      color: #15803d;
    }

    .nav-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .nav-label {
      font-size: 0.875rem;
      font-weight: 500;
      white-space: nowrap;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
      opacity: 1;
      transition: opacity 0.15s ease;
    }

    /* Dropdown */
    .nav-dropdown {
      display: flex;
      flex-direction: column;
    }

    .nav-dropdown-toggle {
      width: 100%;
      background: none;
      border: none;
      font-family: inherit;
      cursor: pointer;
      text-align: left;
    }

    .dropdown-arrow {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      color: #9ca3af;
      transition: transform 0.2s ease;
    }

    .dropdown-arrow.rotated {
      transform: rotate(180deg);
    }

    .nav-submenu {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.2s ease;
      padding-left: 8px;
    }

    .nav-submenu.open {
      max-height: 200px;
    }

    .nav-sublink {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px 8px 24px;
      text-decoration: none;
      color: #6b7280;
      border-radius: 6px;
      transition: all 0.15s ease;
      font-size: 0.8125rem;
    }

    .nav-sublink:hover {
      background-color: #f3f4f6;
      color: #1f2937;
    }

    .nav-sublink.active {
      background-color: #f0fdf4;
      color: #15803d;
    }

    .nav-subicon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .nav-sublabel {
      font-weight: 500;
    }

    .sidebar.collapsed .nav-link {
      justify-content: center;
      padding: 10px;
    }

    .sidebar.collapsed .nav-dropdown-toggle .dropdown-arrow {
      display: none;
    }

    .sidebar.collapsed .nav-submenu {
      position: absolute;
      left: 64px;
      top: 0;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      padding: 8px;
      max-height: none;
      width: max-content;
      min-width: 160px;
      z-index: 200;
    }

    .sidebar.collapsed .nav-dropdown {
      position: relative;
    }

    .sidebar.collapsed .nav-submenu .nav-sublink {
      padding: 8px 12px;
    }

    .sidebar.collapsed .nav-label,
    .sidebar.collapsed .sidebar-create,
    .sidebar.collapsed .logo-text,
    .sidebar.collapsed .footer-label {
      opacity: 0;
      width: 0;
      overflow: hidden;
      pointer-events: none;
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
      padding: 12px;
      border-top: 1px solid #e5e7eb;
      margin-top: auto;
    }

    .footer-actions {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .footer-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      text-decoration: none;
      color: #6b7280;
      border-radius: 8px;
      transition: all 0.15s ease;
      cursor: pointer;
      background: none;
      border: none;
      width: 100%;
      font-size: 0.875rem;
      font-family: inherit;
    }

    .footer-link:hover {
      background-color: #f3f4f6;
      color: #1f2937;
    }

    .footer-link.active {
      background-color: #f0fdf4;
      color: #15803d;
    }

    .footer-link.active .footer-icon {
      color: #15803d;
    }

    .footer-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .footer-label {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      transition: opacity 0.15s ease, width 0.15s ease;
    }

    .logout-link:hover {
      color: #dc2626;
    }

    .logout-link:hover .footer-icon {
      color: #dc2626;
    }

    .footer-bottom-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
    }

    .footer-bottom-row .footer-link {
      flex: 1;
    }

    .toggle-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
      flex-shrink: 0;
    }

    .toggle-btn:hover {
      background: #e5e7eb;
    }

    .toggle-icon {
      width: 18px;
      height: 18px;
      color: #6b7280;
      transition: transform 0.2s ease;
    }

    .toggle-icon.rotated {
      transform: rotate(180deg);
    }

    .sidebar.collapsed .footer-link {
      justify-content: center;
      padding: 10px;
    }

    .sidebar.collapsed .footer-bottom-row {
      flex-direction: column;
      gap: 4px;
    }

    .sidebar.collapsed .footer-bottom-row .footer-link {
      flex: none;
      width: 100%;
    }

    .sidebar.collapsed .toggle-btn {
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
      overflow-y: auto;
      height: 100vh;
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
  expandedMenus: { [key: string]: boolean } = {};
  
  @Input() menuItems: SidebarMenuItem[] = [
    { 
      label: 'Главная', 
      iconPath: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', 
      route: '/home', 
      exact: true 
    },
    { 
      label: 'Клиенты', 
      iconPath: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', 
      route: '/clients' 
    },
    { 
      label: 'Платежи', 
      iconPath: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', 
      route: '/payments' 
    },
    { 
      label: 'Коммуникации', 
      iconPath: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
      children: [
        {
          label: 'WhatsApp',
          iconPath: '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="currentColor"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" stroke="currentColor" stroke-width="1.5"/>',
          route: '/communications/whatsapp'
        },
        {
          label: 'Email',
          iconPath: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 6l-10 7L2 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
          route: '/communications/email'
        }
      ]
    },
    { 
      label: 'Бонусная программа', 
      iconPath: '<path d="M20 12v10H4V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="2" y="7" width="20" height="5" rx="1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 22V7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 7c-2.5-2.5-5-3-5-5a2.5 2.5 0 0 1 5 0c0 2-2.5 2.5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 7c2.5-2.5 5-3 5-5a2.5 2.5 0 0 0-5 0c0 2 2.5 2.5 5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', 
      route: '/bonus-program',
      exact: false
    },
    { 
      label: 'Пользователи', 
      iconPath: '<path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', 
      route: '/users' 
    },
  ];

  @Input() logoText = 'WestWood';
  @Input() createButtonLabel = 'Новая транзакция';

  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() closedChange = new EventEmitter<boolean>();
  @Output() createClick = new EventEmitter<void>();
  @Output() logoutClick = new EventEmitter<void>();

  constructor(private sanitizer: DomSanitizer) {
    if (typeof window !== 'undefined') {
      this.checkMobile();
      
      window.addEventListener('resize', () => {
        this.checkMobile();
      });
    }

    effect(() => {
      const collapsed = this.isCollapsed();
      const closed = this.isClosed();
      this.collapsedChange.emit(collapsed);
      this.closedChange.emit(closed);
      this.sidebarService.setCollapsed(collapsed);
      this.sidebarService.setClosed(closed);
    });
  }

  private sidebarService = inject(SidebarService);
  private transactionModalService = inject(TransactionModalService);
  private store = inject(Store);

  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
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
    this.transactionModalService.open();
    this.createClick.emit();
  }

  onLogoutClick(): void {
    this.store.dispatch(logout());
    this.logoutClick.emit();
  }

  toggleDropdown(label: string): void {
    if (this.isCollapsed()) {
      // В collapsed режиме показываем popup
      this.expandedMenus[label] = !this.expandedMenus[label];
    } else {
      this.expandedMenus[label] = !this.expandedMenus[label];
    }
  }

  isChildActive(item: SidebarMenuItem): boolean {
    if (!item.children) return false;
    const currentUrl = window.location.pathname;
    return item.children.some(child => currentUrl.startsWith(child.route));
  }
}
