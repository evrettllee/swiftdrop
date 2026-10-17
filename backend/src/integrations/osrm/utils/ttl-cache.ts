type CacheEntry<V> = { value: V; expiresAtMs: number };

// A small in-memory cache: an entry lives for `ttlMs`, and beyond `maxEntries` the oldest one
// goes first (a Map keeps the order of insertion). The time is passed in, so it is tested without
// timers.
export class TtlCache<V> {
  private readonly entries = new Map<string, CacheEntry<V>>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries: number,
  ) {}

  get size(): number {
    return this.entries.size;
  }

  get(key: string, nowMs: number): V | undefined {
    const entry = this.entries.get(key);

    if (entry === undefined) {
      return undefined;
    }

    if (nowMs >= entry.expiresAtMs) {
      this.entries.delete(key);

      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: V, nowMs: number): void {
    // Deleted first, so a rewritten entry moves to the end and is evicted last.
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAtMs: nowMs + this.ttlMs });

    for (const oldestKey of this.entries.keys()) {
      if (this.entries.size <= this.maxEntries) {
        break;
      }

      this.entries.delete(oldestKey);
    }
  }
}
