import { PERF_CLIENTS, PERF_FIRST_STAFF_ID, type PerfSeedStep } from './perf-seed-people.sql';

export const PERF_TICKETS = 3000;

const CHAT_TEXTS = `(ARRAY['Здравствуйте, я подъезжаю', 'Буду через 5 минут', 'Хорошо, жду у подъезда',
  'Код домофона 25', 'Спасибо!', 'Я на месте'])`;
const TICKET_TEXTS = `(ARRAY['Не могу найти курьера на карте', 'Списали деньги дважды',
  'Здравствуйте, проверим и вернёмся с ответом', 'Курьер не отвечает', 'Спасибо, всё решилось'])`;

const CHAT = `INSERT INTO messages (sender_id, receiver_id, order_id, content, sent_at, is_read)
SELECT CASE WHEN m % 2 = 1 THEN client_id ELSE ${PERF_CLIENTS} + courier_id END,
  CASE WHEN m % 2 = 1 THEN ${PERF_CLIENTS} + courier_id ELSE client_id END,
  order_id, ${CHAT_TEXTS}[1 + (order_id + m) % 6], a1 + m * interval '2 minutes',
  kind <> 'active' OR m < 4
FROM perf_orders, generate_series(1, 4) m
WHERE courier_id IS NOT NULL AND order_id % 2 = 0`;

const TICKETS_PLAN = `CREATE TEMP TABLE perf_tickets ON COMMIT DROP AS
SELECT t AS ticket_id, o.order_id AS source_order,
  CASE WHEN t % 3 = 0 THEN NULL ELSE o.order_id END AS order_id,
  t % 5 = 0 AND o.courier_id IS NOT NULL AS by_courier,
  CASE WHEN t % 5 = 0 AND o.courier_id IS NOT NULL THEN ${PERF_CLIENTS} + o.courier_id ELSE o.client_id END AS user_id,
  t % 10 >= 7 AS is_open,
  t % 10 IN (7, 8) AS awaiting,
  least(o.t0 + interval '1 hour', now() - interval '3 hours') AS created_at,
  ${PERF_FIRST_STAFF_ID} + t % 5 AS staff_id
FROM generate_series(1, ${PERF_TICKETS}) t
JOIN perf_orders o ON o.order_id = t * 19`;

const TICKETS = `INSERT INTO support_tickets (ticket_id, user_id, order_id, subject, status, created_at, topic,
  last_message_at, awaiting_staff, closed_at, closed_by, updated_at)
OVERRIDING SYSTEM VALUE
SELECT ticket_id, user_id, order_id, CASE WHEN topic = 'other' THEN 'Вопрос по доставке' END,
  CASE WHEN is_open THEN 'open' ELSE 'closed' END::support_ticket_status, created_at, topic::ticket_topic,
  created_at + interval '40 minutes', is_open AND awaiting,
  CASE WHEN is_open THEN NULL ELSE created_at + interval '100 minutes' END,
  CASE WHEN is_open THEN NULL WHEN ticket_id % 2 = 0 THEN user_id ELSE staff_id END,
  created_at + interval '40 minutes'
FROM (
  SELECT perf_tickets.*, CASE
    WHEN ticket_id % 7 = 0 THEN 'other'
    WHEN by_courier THEN (ARRAY['client_unreachable', 'app', 'account'])[1 + ticket_id % 3]
    ELSE (ARRAY['order_problem', 'payment', 'account', 'app'])[1 + ticket_id % 4] END AS topic
  FROM perf_tickets
) tickets`;

const TICKET_MESSAGES = `INSERT INTO messages (sender_id, ticket_id, content, sent_at, is_read)
SELECT CASE WHEN m % 2 = 1 AND NOT (m = 5 AND is_open AND NOT awaiting) THEN user_id ELSE staff_id END,
  ticket_id, ${TICKET_TEXTS}[m], created_at + (m - 1) * interval '10 minutes',
  NOT is_open OR m < 5
FROM perf_tickets, generate_series(1, 5) m`;

const SEQUENCES = `SELECT setval(pg_get_serial_sequence(tbl, col), max_id)
FROM (VALUES
  ('public.tariffs', 'tariff_id', (SELECT max(tariff_id) FROM tariffs)),
  ('public.service_zones', 'zone_id', (SELECT max(zone_id) FROM service_zones)),
  ('public.users', 'user_id', (SELECT max(user_id) FROM users)),
  ('public.courier_profiles', 'courier_profile_id', (SELECT max(courier_profile_id) FROM courier_profiles)),
  ('public.addresses', 'address_id', (SELECT max(address_id) FROM addresses)),
  ('public.orders', 'order_id', (SELECT max(order_id) FROM orders)),
  ('public.support_tickets', 'ticket_id', (SELECT max(ticket_id) FROM support_tickets))
) AS sequences(tbl, col, max_id)`;

export const PERF_SEED_TALK: readonly PerfSeedStep[] = [
  ['chat messages', CHAT],
  ['tickets plan', TICKETS_PLAN],
  ['tickets', TICKETS],
  ['ticket messages', TICKET_MESSAGES],
  ['sequences', SEQUENCES],
];
