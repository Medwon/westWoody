import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TransactionModalService {
  private visibleSource = new BehaviorSubject<boolean>(false);
  visible$: Observable<boolean> = this.visibleSource.asObservable();

  open(): void {
    this.visibleSource.next(true);
  }

  close(): void {
    this.visibleSource.next(false);
  }

  toggle(): void {
    this.visibleSource.next(!this.visibleSource.value);
  }
}

