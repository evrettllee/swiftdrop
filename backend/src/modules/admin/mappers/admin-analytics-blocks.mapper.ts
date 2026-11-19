import { EXTERNAL_SERVICES } from '@/common/constants/service-failure-codes.constants';
import { TICKET_TOPIC, TICKET_TOPIC_VALUES } from '@/common/enums/support-ticket.enum';
import type {
  ExternalServiceRow,
  ServiceAnalytics,
  SupportAnalytics,
} from '../types/admin-analytics.types';

type Topics = SupportAnalytics['topics'];

export function toTopics(rows: Topics): Topics {
  const counts = new Map(rows.map((row) => [row.topic, row.count]));
  const topics = TICKET_TOPIC_VALUES.map((topic) => ({ topic, count: counts.get(topic) ?? 0 }));
  const rank = (topic: Topics[number]) => (topic.topic === TICKET_TOPIC.OTHER ? 1 : 0);

  return topics.sort((first, second) => rank(first) - rank(second) || second.count - first.count);
}

export function toServices(rows: readonly ExternalServiceRow[]): ServiceAnalytics['services'] {
  const byService = new Map(rows.map((row) => [row.service, row]));

  return EXTERNAL_SERVICES.map(
    (service) => byService.get(service) ?? { service, failures: 0, lastAt: null, lastCode: null },
  );
}
