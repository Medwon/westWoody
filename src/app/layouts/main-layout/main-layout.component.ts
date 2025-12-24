import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, SidebarComponent],
  template: `
    <div class="main-layout">]
      <app-sidebar #sidebar (collapsedChange)="onSidebarCollapsed($event)" (closedChange)="onSidebarClosed($event)">
        <div class="main-content-wrapper">
          <main class="main-content">
            <ng-content></ng-content>
          </main>
          <app-footer></app-footer>
        </div>
      </app-sidebar>
    </div>
  `,
  styles: [`
    .main-layout {
      min-height: 100vh;
      display: flex;
      overflow-x: hidden;
      width: 100%;
    }

    .main-content-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      padding-top: 64px;
    }

    .main-content {
      flex: 1;
      padding: 2rem;
      min-height: calc(100vh - 128px);
      background-color: #f9fafb;
    }

    @media (max-width: 768px) {
      .main-content {
        padding: 1rem;
      }
    }
  `]
})
export class MainLayoutComponent {
  @ViewChild('sidebar') sidebar!: SidebarComponent;
  isSidebarCollapsed = false;
  isSidebarClosed = false;

  onSidebarCollapsed(collapsed: boolean): void {
    this.isSidebarCollapsed = collapsed;
  }

  onSidebarClosed(closed: boolean): void {
    this.isSidebarClosed = closed;
  }

  getHeaderMarginLeft(): number {
    // На мобильных устройствах (когда sidebar закрыт), header не имеет отступа
    if (this.isSidebarClosed && window.innerWidth < 769) {
      return 0;
    }
    // На десктопе учитываем состояние sidebar
    if (this.isSidebarClosed) {
      return 64; // На десктопе закрытый sidebar становится свернутым (64px)
    }
    return this.isSidebarCollapsed ? 64 : 240;
  }
}

