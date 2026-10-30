import { Injectable } from '@nestjs/common';
import { UserThrottleGuard } from '@/common/guards/user-throttle.guard';
import { SUPPORT_STAFF_MESSAGE_THROTTLE } from '../constants/support-staff.constants';
import {
  SUPPORT_MESSAGE_THROTTLE,
  SUPPORT_MESSAGES,
  SUPPORT_TICKET_CREATE_THROTTLE,
} from '../constants/support.constants';

@Injectable()
export class SupportTicketCreateThrottleGuard extends UserThrottleGuard {
  protected readonly options = {
    key: SUPPORT_TICKET_CREATE_THROTTLE.KEY,
    limit: SUPPORT_TICKET_CREATE_THROTTLE.LIMIT,
    ttlMs: SUPPORT_TICKET_CREATE_THROTTLE.TTL_MS,
    message: SUPPORT_MESSAGES.TOO_MANY_TICKETS,
  };
}

@Injectable()
export class SupportMessageThrottleGuard extends UserThrottleGuard {
  protected readonly options = {
    key: SUPPORT_MESSAGE_THROTTLE.KEY,
    limit: SUPPORT_MESSAGE_THROTTLE.LIMIT,
    ttlMs: SUPPORT_MESSAGE_THROTTLE.TTL_MS,
    message: SUPPORT_MESSAGES.TOO_MANY_MESSAGES,
  };
}

@Injectable()
export class SupportStaffMessageThrottleGuard extends UserThrottleGuard {
  protected readonly options = {
    key: SUPPORT_STAFF_MESSAGE_THROTTLE.KEY,
    limit: SUPPORT_STAFF_MESSAGE_THROTTLE.LIMIT,
    ttlMs: SUPPORT_STAFF_MESSAGE_THROTTLE.TTL_MS,
    message: SUPPORT_MESSAGES.TOO_MANY_MESSAGES,
  };
}
