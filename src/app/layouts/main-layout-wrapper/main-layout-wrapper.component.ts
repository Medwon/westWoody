import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { MainLayoutComponent } from '../main-layout/main-layout.component';
import { filter } from 'rxjs';

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
export class MainLayoutWrapperComponent implements OnInit {
  private router = inject(Router);

  ngOnInit(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
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
}

