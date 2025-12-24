import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../core/store/app.state';
import { selectUser } from '../../core/store/auth/auth.selectors';
import { User } from '../../core/models/user.model';
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
        <app-avatar [name]="user.name" size="small"></app-avatar>
        <app-typography variant="body2" class="user-name">{{ user.name }}</app-typography>
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
export class HeaderComponent implements OnInit {
  user$: Observable<User | null>;

  constructor(private store: Store<AppState>) {
    this.user$ = this.store.select(selectUser);
  }

  ngOnInit(): void {}

  onLogout(): void {
    this.store.dispatch(logout());
  }
}

