import { Component, OnInit, OnDestroy } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { Router } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { GlobalService } from '../../shared/services/global.service';
import { ThemeService } from '../../shared/services/theme.service';
import { WorkerService } from '../../shared/services/worker.service';
import { WorkerType } from '../../shared/models/worker';
import { WalletInfo } from '../../shared/models/wallet-info';
import { TransactionInfo } from '../../shared/models/transaction-info';
import { TransactionDetailsComponent } from '../transaction-details/transaction-details.component';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-history-component',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css'],
})
export class HistoryComponent implements OnInit, OnDestroy {
  constructor(
    private apiService: ApiService,
    private globalService: GlobalService,
    private router: Router,
    public dialogService: DialogService,
    public themeService: ThemeService,
    private worker: WorkerService,
  ) {
    this.isDarkTheme = themeService.getCurrentTheme().themeType === 'dark';
  }

  public transactions: TransactionInfo[];
  public coinUnit: string;
  public pageNumber = 1;
  public hasTransaction = true;
  public isDarkTheme = false;

  ngOnInit() {
    this.worker.timerStatusChanged.subscribe((status) => {
      if (status.running) {
        if (status.worker === WorkerType.HISTORY) { this.updateWalletHistory(); }
      }
    });
    this.worker.Start(WorkerType.HISTORY);
    this.coinUnit = this.globalService.getCoinUnit();
  }

  ngOnDestroy() {
    this.worker.Stop(WorkerType.HISTORY);
  }

  onDashboardClicked() {
    this.router.navigate(['/wallet']);
  }

  public openTransactionDetailDialog(transaction: any) {
    const modalData = { transaction };

    this.dialogService.open(TransactionDetailsComponent, {
      header: 'Receive',
      data: modalData
    });
  }

  private updateWalletHistory() {
    this.worker.Stop(WorkerType.HISTORY);
    const walletInfo = new WalletInfo(this.globalService.getWalletName());
    let historyResponse;
    this.apiService.getWalletHistory(walletInfo, 0, 10)
      .pipe(finalize(() => {
        this.worker.Start(WorkerType.HISTORY);
      }))
      .subscribe(
        response => {
          if (!!response.history && response.history[0].transactionsHistory.length > 0) {
            historyResponse = response.history[0].transactionsHistory;
            this.getTransactionInfo(historyResponse);
          } else {
            this.hasTransaction = false;
          }
        },
        error => {
          this.apiService.handleException(error);
        }
      );
  }

  private getTransactionInfo(transactions: any) {
    this.transactions = [];

    for (const transaction of transactions) {
      let transactionType;
      if (transaction.type === 'send') {
        transactionType = 'sent';
      } else if (transaction.type === 'received') {
        transactionType = 'received';
      } else if (transaction.type === 'staked') {
        transactionType = 'staked';
      }
      const transactionId = transaction.id;
      const transactionAmount = transaction.amount;
      let transactionFee;
      if (transaction.fee) {
        transactionFee = transaction.fee;
      } else {
        transactionFee = 0;
      }
      const transactionConfirmedInBlock = transaction.confirmedInBlock;
      const transactionTimestamp = transaction.timestamp;

      this.transactions.push(new TransactionInfo(transactionType, transactionId, transactionAmount, transactionFee, transactionConfirmedInBlock, transactionTimestamp));
    }
    if (this.transactions === undefined || this.transactions.length === 0) {
      this.hasTransaction = false;
    }
  }

}
