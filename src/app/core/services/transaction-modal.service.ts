import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface TransactionResult {
  clientName: string;
  phone: string;
  amount: number;
  bonuses: number;
  isNewClient: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionModalService {
  private visibleSource = new BehaviorSubject<boolean>(false);
  visible$: Observable<boolean> = this.visibleSource.asObservable();

  private initialPhoneSource = new BehaviorSubject<string | null>(null);
  initialPhone$: Observable<string | null> = this.initialPhoneSource.asObservable();

  private transactionCompleteSource = new Subject<TransactionResult>();
  transactionComplete$: Observable<TransactionResult> = this.transactionCompleteSource.asObservable();

  open(phone?: string): void {
    if (phone) {
      this.initialPhoneSource.next(phone);
    } else {
      this.initialPhoneSource.next(null);
    }
    this.visibleSource.next(true);
  }

  close(): void {
    this.visibleSource.next(false);
    this.initialPhoneSource.next(null);
  }

  toggle(): void {
    this.visibleSource.next(!this.visibleSource.value);
  }

  emitTransactionComplete(result: TransactionResult): void {
    this.transactionCompleteSource.next(result);
  }
}

