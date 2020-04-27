import { EntityRepository, Repository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface Resume {
  transactions: Transaction[];
  balance: Balance;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async all(): Promise<Resume> {
    const transactionsInstace = getRepository(Transaction);

    const transactions = await transactionsInstace.find({
      relations: ['category'],
      select: [
        'id',
        'title',
        'type',
        'value',
        'created_at',
        'updated_at',
        'category',
      ],
    });

    const balance = await this.getBalance(transactions);
    return {
      transactions,
      balance,
    };
  }

  public async getBalance(transactions?: Transaction[]): Promise<Balance> {
    let income = 0;
    let outcome = 0;
    let _transactions: Transaction[];

    if (transactions) {
      _transactions = transactions;
    } else {
      const transactionsRepository = getRepository(Transaction);
      _transactions = await transactionsRepository.find();
    }

    _transactions.map(transaction => {
      if (transaction.type === 'income') {
        income += transaction.value;
      } else {
        outcome += transaction.value;
      }
      return null;
    });

    return {
      income,
      outcome,
      total: income - outcome,
    };
  }
}

export default TransactionsRepository;
