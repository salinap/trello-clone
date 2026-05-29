import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';

config({
  path: `.env`,
});

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
