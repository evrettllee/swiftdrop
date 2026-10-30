import { Injectable } from '@nestjs/common';
import { UserThrottleGuard } from '@/common/guards/user-throttle.guard';
import { MANAGER_ANALYTICS_THROTTLE } from '../constants/manager-analytics.constants';
import {
  MANAGER_EXPORT_MESSAGES,
  MANAGER_EXPORT_THROTTLE,
} from '../constants/manager-export.constants';

@Injectable()
export class ManagerExportThrottleGuard extends UserThrottleGuard {
  protected readonly options = {
    key: MANAGER_EXPORT_THROTTLE.KEY,
    limit: MANAGER_EXPORT_THROTTLE.LIMIT,
    ttlMs: MANAGER_EXPORT_THROTTLE.TTL_MS,
    message: MANAGER_EXPORT_MESSAGES.TOO_MANY,
  };
}

@Injectable()
export class ManagerAnalyticsThrottleGuard extends UserThrottleGuard {
  protected readonly options = {
    key: MANAGER_ANALYTICS_THROTTLE.KEY,
    limit: MANAGER_ANALYTICS_THROTTLE.LIMIT,
    ttlMs: MANAGER_ANALYTICS_THROTTLE.TTL_MS,
    message: MANAGER_ANALYTICS_THROTTLE.MESSAGE,
  };
}
