import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectUser, selectUserFullName } from '../../core/store/auth/auth.selectors';
import { logout } from '../../core/store/auth/auth.actions';
import { AppBarComponent } from '../../shared/components/app-bar/app-bar.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { TypographyComponent } from '../../shared/components/typography/typography.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, AppBarComponent, ButtonComponent, TypographyComponent, AvatarComponent],
  template: `
    <app-app-bar [fixed]="true">
      <div appBarStart></div>
      <div appBarEnd *ngIf="user$ | async as user">
        <app-avatar [name]="(userFullName$ | async) || user.email" size="small"></app-avatar>
        <app-typography variant="body2" class="user-name">{{ userFullName$ | async }}</app-typography>
        <app-button buttonType="outline" size="small" (onClick)="onLogout()">
          Выйти
        </app-button>
      </div>
    </app-app-bar>
  `,
  styles: [`
    .user-name {
      margin: 0 0.75rem;
    }
  `]
})
export class HeaderComponent {
  private store = inject(Store);
  user$ = this.store.select(selectUser);
  userFullName$ = this.store.select(selectUserFullName);

  onLogout(): void {
    this.store.dispatch(logout());
  }
}
