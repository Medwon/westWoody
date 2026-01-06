import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private collapsedSource = new BehaviorSubject<boolean>(false);
  private closedSource = new BehaviorSubject<boolean>(false);

  collapsed$: Observable<boolean> = this.collapsedSource.asObservable();
  closed$: Observable<boolean> = this.closedSource.asObservable();

  setCollapsed(collapsed: boolean): void {
    this.collapsedSource.next(collapsed);
  }

  setClosed(closed: boolean): void {
    this.closedSource.next(closed);
  }

  get isCollapsed(): boolean {
    return this.collapsedSource.value;
  }

  get isClosed(): boolean {
    return this.closedSource.value;
  }
}

