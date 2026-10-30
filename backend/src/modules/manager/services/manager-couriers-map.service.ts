import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { toCourierMapCounts, toCourierMapItem } from '../mappers/courier-map.mapper';
import type { CouriersMap } from '../types/manager-couriers-map.types';
import { type CouriersMapFilters, couriersMapQueries } from '../utils/couriers-map-query';

@Injectable()
export class ManagerCouriersMapService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async find(filters: CouriersMapFilters): Promise<CouriersMap> {
    const queries = couriersMapQueries(this.db, filters);
    const countQueries = couriersMapQueries(this.db, { ...filters, states: null });
    const [rows, counts] = await Promise.all([queries.items, countQueries.counts]);

    return { items: rows.map(toCourierMapItem), counts: toCourierMapCounts(counts) };
  }
}
