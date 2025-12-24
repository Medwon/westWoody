import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainLayoutComponent } from '../main-layout/main-layout.component';

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
export class MainLayoutWrapperComponent {}

