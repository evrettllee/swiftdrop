import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import type { CourierLookupDto } from '../dto/manager-courier-lookup.dto';
import { toCourierLookupItem } from '../mappers/courier-lookup.mapper';
import type { CourierLookupItem } from '../types/manager-courier-lookup.types';
import { courierLookupQuery } from '../utils/courier-lookup-query';

@Injectable()
export class ManagerCourierLookupService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async find(query: CourierLookupDto): Promise<CourierLookupItem[]> {
    const rows = await courierLookupQuery(this.db, query);

    return rows.map(toCourierLookupItem);
  }
}
