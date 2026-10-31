export type PerfSeedStep = readonly [label: string, statement: string];

export const PERF_CLIENTS = 5000;
export const PERF_COURIERS = 300;
export const PERF_FIRST_STAFF_ID = PERF_CLIENTS + PERF_COURIERS + 1;

const FIRST_NAMES = `(ARRAY['Иван','Алексей','Дмитрий','Сергей','Андрей','Павел','Максим','Артём','Никита','Егор',
  'Анна','Мария','Елена','Ольга','Наталья','Ирина','Татьяна','Юлия','Дарья','Екатерина'])`;
const LAST_NAMES = `(ARRAY['Иванов','Петров','Сидоров','Козлов','Новиков','Морозов','Волков','Соколов',
  'Лебедев','Ковалёв','Кузнецов','Попов','Васильев','Зайцев','Павлов'])`;

export function personName(id: string): string {
  return `${FIRST_NAMES}[1 + ${id} % 20]`;
}

export function personSurname(id: string): string {
  return `${LAST_NAMES}[1 + (${id} / 20) % 15] || CASE WHEN ${id} % 20 >= 10 THEN 'а' ELSE '' END`;
}

export const PERF_SEED_PEOPLE: readonly PerfSeedStep[] = [
  ['reset', 'TRUNCATE TABLE users, tariffs, service_zones RESTART IDENTITY CASCADE'],
  ['seed', 'SELECT setseed(0.287)'],
  [
    'tariffs',
    `INSERT INTO tariffs (tariff_id, name, price_per_km, price_per_kg, min_price, fragile_fee)
     OVERRIDING SYSTEM VALUE
     VALUES (1, 'Стандарт', 1.00, 0.50, 5.00, 2.00), (2, 'Экспресс', 1.50, 0.70, 7.00, 2.50),
       (3, 'Груз', 2.00, 1.00, 10.00, 3.00)`,
  ],
  [
    'zones',
    `INSERT INTO service_zones (zone_id, name, polygon, tariff_id, priority, is_active)
     OVERRIDING SYSTEM VALUE
     SELECT z, 'Зона ' || z,
       jsonb_build_array(jsonb_build_array(jsonb_build_array(x0, y0), jsonb_build_array(x1, y0),
         jsonb_build_array(x1, y1), jsonb_build_array(x0, y1), jsonb_build_array(x0, y0))),
       1 + z % 3, z % 3, z <> 20
     FROM (
       SELECT z, 27.40 + ((z - 1) % 5) * 0.06 AS x0, 27.46 + ((z - 1) % 5) * 0.06 AS x1,
         53.83 + ((z - 1) / 5) * 0.035 AS y0, 53.865 + ((z - 1) / 5) * 0.035 AS y1
       FROM generate_series(1, 20) z
     ) grid`,
  ],
  [
    'users',
    `INSERT INTO users (user_id, role_id, first_name, last_name, email, phone, email_verified_at,
       created_at)
     OVERRIDING SYSTEM VALUE
     SELECT g,
       (SELECT role_id FROM roles WHERE name = CASE
         WHEN g <= ${PERF_CLIENTS} THEN 'client'
         WHEN g < ${PERF_FIRST_STAFF_ID} THEN 'courier'
         WHEN g < ${PERF_FIRST_STAFF_ID + 5} THEN 'manager'
         ELSE 'admin' END),
       ${personName('g')}, ${personSurname('g')},
       'perf' || g || '@swiftdrop.test', '+37529' || lpad(g::text, 7, '0'), now(),
       now() - interval '150 days' + (g % 1000) * interval '1 hour'
     FROM generate_series(1, ${PERF_FIRST_STAFF_ID + 5}) g`,
  ],
  [
    'courier profiles',
    `INSERT INTO courier_profiles (courier_profile_id, user_id, is_available, current_lat,
       current_lng, location_updated_at)
     OVERRIDING SYSTEM VALUE
     SELECT c, ${PERF_CLIENTS} + c, c <= ${PERF_COURIERS / 2},
       CASE WHEN c <= ${PERF_COURIERS / 2} THEN 53.86 + random() * 0.1 END,
       CASE WHEN c <= ${PERF_COURIERS / 2} THEN 27.42 + random() * 0.26 END,
       CASE WHEN c <= ${PERF_COURIERS / 2} THEN now() - random() * interval '20 seconds' END
     FROM generate_series(1, ${PERF_COURIERS}) c`,
  ],
  [
    'vehicles',
    `INSERT INTO vehicles (courier_profile_id, type)
     SELECT c, (ARRAY['foot', 'bicycle', 'scooter', 'car', 'truck'])[1 + c % 5]::vehicle_type
     FROM generate_series(1, ${PERF_COURIERS}) c`,
  ],
  [
    'shifts',
    `INSERT INTO courier_shifts (courier_id, started_at, ended_at)
     SELECT c, started_at,
       CASE WHEN open THEN NULL ELSE started_at + (4 + c % 5) * interval '1 hour' END
     FROM (
       SELECT c, k, k = 30 AND c <= ${PERF_COURIERS / 2} AS open,
         CASE WHEN k = 30 AND c <= ${PERF_COURIERS / 2}
           THEN now() - (1 + c % 5) * interval '1 hour'
           ELSE now() - interval '120 days' + (k - 1) * interval '4 days' + (c % 12) * interval '1 hour'
         END AS started_at
       FROM generate_series(1, ${PERF_COURIERS}) c, generate_series(1, 30) k
     ) shifts`,
  ],
];
