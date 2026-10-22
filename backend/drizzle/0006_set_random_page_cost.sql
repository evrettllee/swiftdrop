-- Custom SQL migration file, put your code below! --
-- random_page_cost = 1.1: the database runs on SSD storage, and the default 4 is tuned for
-- spinning disks. With 4 the planner prefers the primary key over (order_id, message_id) for
-- chat history and reads most of the table for the first page of an old order.
-- Set on the database, not the server or a session; new sessions pick it up. The name is not
-- hard-coded, so the same migration works for every database it runs on.
DO $$
BEGIN
  EXECUTE format('ALTER DATABASE %I SET random_page_cost = %s', current_database(), '1.1');
END
$$;
