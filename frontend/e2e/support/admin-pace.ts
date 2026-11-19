const WRITE_WINDOW_MS = 61_000;
const WRITES_ALLOWED = 18;
const written: number[] = [];

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function paceAdminWrite(): Promise<void> {
  const now = Date.now();

  while (written.length > 0 && now - written[0] >= WRITE_WINDOW_MS) {
    written.shift();
  }

  if (written.length >= WRITES_ALLOWED) {
    await wait(written[0] + WRITE_WINDOW_MS - now);
    written.shift();
  }

  written.push(Date.now());
}
