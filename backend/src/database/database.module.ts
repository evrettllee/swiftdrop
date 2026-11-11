import { Global, Inject, Logger, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { ENV_KEYS } from '@/config/env.constants';
import * as schema from './schema';
import {
  DB_CASING,
  DB_CONNECTION_OPTIONS,
  DB_PING_QUERY,
  DB_POOL_MAX,
  DRIZZLE,
  PG_POOL,
} from './database.constants';

export type Database = NodePgDatabase<typeof schema>;
// The handle a callback of db.transaction gets.
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const pool = new Pool({
          connectionString: config.getOrThrow<string>(ENV_KEYS.DATABASE_URL),
          options: DB_CONNECTION_OPTIONS,
          max: DB_POOL_MAX,
        });
        await pool.query(DB_PING_QUERY);
        Logger.log('Connected to PostgreSQL', 'Database');
        return pool;
      },
    },
    {
      provide: DRIZZLE,
      inject: [PG_POOL],
      useFactory: (pool: Pool): Database => drizzle({ client: pool, schema, casing: DB_CASING }),
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
