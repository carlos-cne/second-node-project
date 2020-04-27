import { getRepository, getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import AppError from '../errors/AppError';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

type TransactionType = 'income' | 'outcome';

interface Request {
  title: string;
  value: number;
  type: TransactionType;
  category: string;
}
class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    if (value <= 0) {
      throw new AppError('The value must be greater than zero', 403);
    }

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('The selected type is unkown.', 403);
    }

    const transactionRepository = getCustomRepository(TransactionsRepository);

    const { total } = await transactionRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError("You don't have enougth balance");
    }

    const categoryRepository = getRepository(Category);

    const categoryExists = await categoryRepository.findOne({
      where: { title: category },
    });

    if (categoryExists) {
      const transaction = await this.createTransaction({
        title,
        type,
        value,
        category: categoryExists.id,
      });

      return transaction;
    }

    const newCategory = categoryRepository.create({
      title: category,
    });
    await categoryRepository.save(newCategory);

    const transaction = await this.createTransaction({
      title,
      type,
      value,
      category: newCategory.id,
    });

    return transaction;
  }

  private async createTransaction({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionInstace = getRepository(Transaction);

    const transaction = transactionInstace.create({
      title,
      type,
      value,
      category_id: category,
    });

    await transactionInstace.save(transaction);

    delete transaction.category_id;
    return transaction;
  }
}

export default CreateTransactionService;
