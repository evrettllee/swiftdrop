import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import {
  CANDIDATE_SORT,
  SUITABLE_CANDIDATES_LIMIT,
  UNSUITABLE_CANDIDATES_LIMIT,
} from '../constants/manager-assignment.constants';
import type { CourierCandidatesDto } from '../dto/manager-assignment.dto';
import { toCandidateView, toUnsuitableView } from '../mappers/courier-candidate.mapper';
import type { CourierCandidates } from '../types/manager-assignment.types';
import { loadAssignableOrder } from '../utils/assignable-order';
import { courierCandidatesQuery } from '../utils/courier-candidates-query';

@Injectable()
export class ManagerCourierCandidatesService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async find(
    orderId: number,
    query: CourierCandidatesDto,
    now: Date = new Date(),
  ): Promise<CourierCandidates> {
    const order = await loadAssignableOrder(this.db, orderId, false);
    const filters = { search: query.search, vehicleTypes: query.vehicleTypes };
    const [suitable, unsuitable] = await Promise.all([
      courierCandidatesQuery(this.db, order, now, {
        filters,
        suitable: true,
        sort: query.sort,
        limit: SUITABLE_CANDIDATES_LIMIT,
      }),
      courierCandidatesQuery(this.db, order, now, {
        filters,
        suitable: false,
        sort: CANDIDATE_SORT.NAME,
        limit: UNSUITABLE_CANDIDATES_LIMIT,
      }),
    ]);

    return {
      suitable: suitable.map(toCandidateView),
      unsuitable: unsuitable.map(toUnsuitableView),
    };
  }
}
