import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { PageHeaderComponent } from '../page-header/page-header.component';
import { TransactionModalComponent } from '../../shared/components/transaction-modal/transaction-modal.component';
import { TransactionModalService } from '../../core/services/transaction-modal.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, SidebarComponent, PageHeaderComponent, TransactionModalComponent],
  template: `
    <div class="main-layout">
      <app-sidebar #sidebar (collapsedChange)="onSidebarCollapsed($event)" (closedChange)="onSidebarClosed($event)">
        <div class="main-content-wrapper">
          <app-page-header></app-page-header>
          <main class="main-content">
            <ng-content></ng-content>
          </main>
        </div>
      </app-sidebar>
    </div>

    <!-- Global Transaction Modal -->
    <app-transaction-modal
      [visible]="(transactionModalService.visible$ | async) ?? false"
      (visibleChange)="transactionModalService.close()"
      (transactionComplete)="onTransactionComplete($event)">
    </app-transaction-modal>
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
      padding: 0 2rem;
    }

    app-page-header {
      display: block;
      background-color: #f9fafb;
    }

    .main-content {
      flex: 1;
      background-color: #f9fafb;
    }

    @media (max-width: 768px) {
      .main-content-wrapper {
        padding: 0 1rem;
      }
    }
  `]
})
export class MainLayoutComponent {
  @ViewChild('sidebar') sidebar!: SidebarComponent;
  isSidebarCollapsed = false;
  isSidebarClosed = false;
  
  transactionModalService = inject(TransactionModalService);

  onSidebarCollapsed(collapsed: boolean): void {
    this.isSidebarCollapsed = collapsed;
  }

  onSidebarClosed(closed: boolean): void {
    this.isSidebarClosed = closed;
  }

  onTransactionComplete(result: any): void {
    console.log('Transaction completed:', result);
    // Здесь можно добавить логику обработки транзакции
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

