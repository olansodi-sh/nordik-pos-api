import 'reflect-metadata';
import { DataSource } from 'typeorm';

const url =
  process.env.DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5442/nordikhat_pos';

const AppDataSource = new DataSource({
  type: 'postgres',
  url,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});

export default AppDataSource;
