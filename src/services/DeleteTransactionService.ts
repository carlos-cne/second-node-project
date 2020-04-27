import { getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import AppError from '../errors/AppError';

class DeleteTransactionService {
  public async execute({ id }: { id: string }): Promise<void> {
    const transactionsRepository = getRepository(Transaction);

    const transactionExists = await transactionsRepository.findOne(id);

    if (!transactionExists) {
      throw new AppError('This transaction does not exists');
    }

    await transactionsRepository.delete(id);
  }
}

export default DeleteTransactionService;
