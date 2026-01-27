import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { MainLayoutComponent } from '../main-layout/main-layout.component';
import { Store } from '@ngrx/store';
import { filter, takeUntil } from 'rxjs';
import { Subject } from 'rxjs';
import { AppState } from '../../core/store/app.state';
import { selectIsAuthenticated } from '../../core/store/auth/auth.selectors';
import { UserActivityService } from '../../core/services/user-activity.service';

@Component({
  selector: 'app-main-layout-wrapper',
  standalone: true,
  imports: [RouterOutlet, MainLayoutComponent],
  template: `
    <app-main-layout>
      <router-outlet></router-outlet>
    </app-main-layout>
  `
})
export class MainLayoutWrapperComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private store = inject(Store<AppState>);
  private userActivityService = inject(UserActivityService);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Listen to authentication state changes and start/stop heartbeat accordingly
    this.store.select(selectIsAuthenticated)
      .pipe(takeUntil(this.destroy$))
      .subscribe((isAuthenticated) => {
        if (isAuthenticated) {
          this.userActivityService.startHeartbeat();
        } else {
          this.userActivityService.stopHeartbeat();
        }
      });

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Прокручиваем основной контейнер контента
        setTimeout(() => {
          // Главный прокручиваемый контейнер - sidebar-content
          const sidebarContent = document.querySelector('.sidebar-content');
          if (sidebarContent) {
            sidebarContent.scrollTop = 0;
          }
          
          // Также пробуем стандартные элементы на всякий случай
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }, 0);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.userActivityService.stopHeartbeat();
  }
}

