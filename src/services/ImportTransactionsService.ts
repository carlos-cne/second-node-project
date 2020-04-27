import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { getRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import uploadConfig from '../config/uploadConfig';
import Category from '../models/Category';

interface TransactionObject {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class ImportTransactionsService {
  async execute({ fileName }: { fileName: string }): Promise<Transaction[]> {
    const transactionsRepository = getRepository(Transaction);
    const categoriesRepository = getRepository(Category);

    const transactions: TransactionObject[] = [];
    const categories: string[] = [];

    const pathToFile = path.join(uploadConfig.directory, fileName);
    const readCSVStream = fs.createReadStream(pathToFile);
    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });
    const parseCSV = readCSVStream.pipe(parseStream);

    parseCSV.on('data', transaction => {
      const [title, type, value, category] = transaction;

      if (!title || !type || !value) {
        return;
      }

      transactions.push({
        title,
        type,
        value,
        category,
      });

      categories.push(category);
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitle = existentCategories.map(
      category => category.title,
    );

    const newCategories = categories
      .filter(category => !existentCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const addedCategoryTitles = categoriesRepository.create(
      newCategories.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(addedCategoryTitles);

    const allCategories = [...existentCategories, ...addedCategoryTitles];

    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);

    await fs.promises.unlink(pathToFile);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
