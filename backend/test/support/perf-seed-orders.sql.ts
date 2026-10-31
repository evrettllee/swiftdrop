import {
  PERF_CLIENTS,
  PERF_COURIERS,
  type PerfSeedStep,
  personName,
  personSurname,
} from './perf-seed-people.sql';

export const PERF_ORDERS = 60_000;
const COURIER_HOLDING = `('courier_assigned', 'picked_up', 'in_transit')`;
const STREETS = `(ARRAY['пр. Независимости', 'ул. Немига', 'ул. Сурганова', 'пр. Победителей',
  'ул. Кальварийская', 'ул. Притыцкого', 'пр. Дзержинского', 'ул. Якуба Коласа'])`;

const ORDERS_TABLE = `CREATE TEMP TABLE perf_orders ON COMMIT DROP AS
WITH s1 AS (
  SELECT g,
    CASE WHEN g % 100 < 85 THEN 'delivered' WHEN g % 100 < 93 THEN 'cancelled' ELSE 'active' END AS kind,
    (g / 100) * 7 + g % 100 - 93 AS active_rank,
    1 + floor(${PERF_CLIENTS} * power(random(), 2))::int AS client_id,
    random() AS r_time, random() AS r1, random() AS r2, random() AS r3
  FROM generate_series(1, ${PERF_ORDERS}) g
), s2 AS (
  SELECT s1.*,
    CASE WHEN kind = 'active' THEN now() - interval '1 hour' - interval '5 hours' * r_time
      ELSE now() - interval '3 hours' - interval '117 days' * r_time END AS t0,
    CASE WHEN kind <> 'active' THEN kind
      WHEN active_rank < 120 THEN (ARRAY['courier_assigned', 'picked_up', 'in_transit'])[1 + active_rank % 3]
      ELSE (ARRAY['pending', 'pending', 'confirmed', 'confirmed', 'confirmed', 'confirmed', 'confirmed',
        'awaiting_manual_assignment', 'awaiting_manual_assignment', 'awaiting_manual_assignment'])[1 + active_rank % 10]
    END AS status,
    CASE WHEN kind = 'cancelled' THEN (ARRAY['pending', 'pending', 'confirmed', 'assigned'])[1 + g % 4] END AS stage
  FROM s1
), s3 AS (
  SELECT s2.*,
    (kind = 'delivered' AND g % 10 = 0) OR status = 'awaiting_manual_assignment' AS manual,
    status <> 'pending' AND (kind <> 'cancelled' OR stage <> 'pending') AS reached_confirmed,
    kind = 'delivered' OR status IN ${COURIER_HOLDING} OR stage = 'assigned' AS reached_assigned,
    kind = 'delivered' OR status IN ('picked_up', 'in_transit') AS reached_picked,
    kind = 'delivered' OR status = 'in_transit' AS reached_transit,
    CASE WHEN kind = 'delivered' OR stage = 'assigned' THEN 1 + (g * 7919) % ${PERF_COURIERS}
      WHEN status IN ${COURIER_HOLDING} THEN active_rank + 1 END AS courier_id,
    60 + r1 * 120 AS off_c
  FROM s2
), s4 AS (
  SELECT s3.*, off_c + 60 + r2 * 540 + CASE WHEN manual THEN 600 ELSE 0 END AS off_a FROM s3
), s5 AS (
  SELECT s4.*, off_a + 600 + r3 * 900 AS off_p FROM s4
)
SELECT g AS order_id, kind, status, stage, manual, client_id, courier_id, reached_confirmed,
  reached_assigned, reached_picked, reached_transit, r1, r2, r3, t0,
  t0 + make_interval(secs => off_c) AS c1,
  t0 + make_interval(secs => off_a) AS a1,
  t0 + make_interval(secs => off_p) AS p1,
  t0 + make_interval(secs => off_p + 960 + r1 * 2100) AS d1,
  round((5 + r2 * 20)::numeric, 2) AS price
FROM s5`;

const FINISH = `UPDATE perf_orders SET d1 = CASE
  WHEN kind = 'delivered' THEN d1
  WHEN stage = 'pending' THEN t0 + interval '20 minutes'
  WHEN stage = 'confirmed' THEN c1 + interval '10 minutes'
  WHEN stage = 'assigned' THEN a1 + interval '5 minutes' END`;

const ORDERS = `INSERT INTO orders (order_id, client_id, courier_id, tariff_id, pickup_address_id,
  delivery_address_id, status, recipient_name, recipient_phone, price, distance_km,
  estimated_delivery_at, otp_code, created_at, finished_at, status_changed_at, estimated_minutes)
OVERRIDING SYSTEM VALUE
SELECT order_id, client_id, courier_id, 1 + order_id % 3, 2 * order_id - 1, 2 * order_id,
  status::order_status, ${personName('(order_id + 7)')} || ' ' || ${personSurname('(order_id + 7)')},
  '+37525' || lpad((order_id % 10000000)::text, 7, '0'), price, round((1 + r3 * 15)::numeric, 2),
  CASE WHEN reached_assigned THEN a1 + interval '40 minutes' END,
  CASE WHEN reached_assigned THEN lpad((order_id % 10000)::text, 4, '0') END,
  t0, d1,
  CASE status WHEN 'pending' THEN t0 WHEN 'confirmed' THEN c1
    WHEN 'awaiting_manual_assignment' THEN c1 + interval '5 minutes' WHEN 'courier_assigned' THEN a1
    WHEN 'picked_up' THEN p1 WHEN 'in_transit' THEN p1 + interval '1 minute' ELSE d1 END,
  30 + order_id % 30
FROM perf_orders`;

const HISTORY = `INSERT INTO order_status_history (order_id, status, changed_by, changed_at)
SELECT order_id, 'pending'::order_status, client_id, t0 FROM perf_orders
UNION ALL SELECT order_id, 'confirmed', NULL, c1 FROM perf_orders WHERE reached_confirmed
UNION ALL SELECT order_id, 'awaiting_manual_assignment', NULL, c1 + interval '5 minutes'
  FROM perf_orders WHERE manual
UNION ALL SELECT order_id, 'courier_assigned',
  CASE WHEN manual THEN ${PERF_CLIENTS + PERF_COURIERS + 1} + order_id % 5
    ELSE ${PERF_CLIENTS} + courier_id END, a1
  FROM perf_orders WHERE reached_assigned
UNION ALL SELECT order_id, 'picked_up', ${PERF_CLIENTS} + courier_id, p1 FROM perf_orders WHERE reached_picked
UNION ALL SELECT order_id, 'in_transit', ${PERF_CLIENTS} + courier_id, p1 + interval '1 minute'
  FROM perf_orders WHERE reached_transit
UNION ALL SELECT order_id, 'delivered', ${PERF_CLIENTS} + courier_id, d1 FROM perf_orders WHERE kind = 'delivered'
UNION ALL SELECT order_id, 'cancelled',
  CASE order_id % 3 WHEN 0 THEN client_id WHEN 1 THEN ${PERF_CLIENTS + PERF_COURIERS + 1} END, d1
  FROM perf_orders WHERE kind = 'cancelled'`;

const OFFERS = `INSERT INTO order_offers (order_id, courier_id, status, offered_at, expires_at,
  responded_at, pickup_eta_sec, total_eta_sec, round)
SELECT order_id, offer_courier, offer_status::order_offer_status, offered_at,
  offered_at + interval '30 seconds',
  CASE WHEN offer_status IN ('accepted', 'declined') THEN offered_at + interval '10 seconds' END,
  300 + order_id % 600, 1200 + order_id % 1800, 1
FROM (
  SELECT order_id, k, c1 + (k - 1) * interval '1 minute' + interval '5 seconds' AS offered_at,
    CASE WHEN reached_assigned AND NOT manual AND k = n THEN courier_id
      ELSE 1 + (coalesce(courier_id, order_id) + k * 37) % ${PERF_COURIERS} END AS offer_courier,
    CASE WHEN reached_assigned AND NOT manual AND k = n THEN 'accepted'
      WHEN k % 2 = 0 THEN 'declined' ELSE 'expired' END AS offer_status
  FROM (SELECT perf_orders.*, CASE WHEN manual THEN 3 ELSE 1 + order_id % 3 END AS n
    FROM perf_orders WHERE reached_confirmed) o, generate_series(1, n) k
) offers`;

const PAYMENTS = `INSERT INTO payments (order_id, amount, status, stripe_payment_id, created_at, amount_usd,
  exchange_rate, checkout_session_id, paid_at, refunded_at)
SELECT order_id, price, pay_status::payment_status,
  CASE WHEN pay_status IN ('paid', 'refunded') THEN 'pi_perf_' || order_id END,
  t0 + interval '10 seconds', round(price / 3.0371, 2), 3.0371, 'cs_perf_' || order_id,
  CASE WHEN pay_status IN ('paid', 'refunded') THEN c1 END,
  CASE WHEN pay_status = 'refunded' THEN d1 END
FROM (
  SELECT perf_orders.*, CASE WHEN reached_confirmed AND kind = 'cancelled' THEN 'refunded'
    WHEN reached_confirmed THEN 'paid' WHEN status = 'pending' THEN 'pending' ELSE 'failed' END AS pay_status
  FROM perf_orders WHERE reached_confirmed OR status = 'pending' OR order_id % 8 = 0
) p`;

export const PERF_SEED_ORDERS: readonly PerfSeedStep[] = [
  ['orders plan', ORDERS_TABLE],
  ['orders finish', FINISH],
  [
    'addresses',
    `INSERT INTO addresses (address_id, city, street, house, latitude, longitude)
     OVERRIDING SYSTEM VALUE
     SELECT a, 'Минск', ${STREETS}[1 + a % 8], (1 + a % 120)::text,
       53.86 + random() * 0.1, 27.42 + random() * 0.26
     FROM generate_series(1, ${PERF_ORDERS * 2}) a`,
  ],
  ['orders', ORDERS],
  [
    'packages',
    `INSERT INTO packages (order_id, weight, length, width, height, is_fragile)
     SELECT order_id, round((0.2 + r1 * 9)::numeric, 2), 30, 20, 15, order_id % 9 = 0 FROM perf_orders`,
  ],
  ['history', HISTORY],
  ['offers', OFFERS],
  ['payments', PAYMENTS],
];
