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

  private transactionCompleteSource = new Subject<TransactionResult>();
  transactionComplete$: Observable<TransactionResult> = this.transactionCompleteSource.asObservable();

  open(): void {
    this.visibleSource.next(true);
  }

  close(): void {
    this.visibleSource.next(false);
  }

  toggle(): void {
    this.visibleSource.next(!this.visibleSource.value);
  }

  emitTransactionComplete(result: TransactionResult): void {
    this.transactionCompleteSource.next(result);
  }
}

