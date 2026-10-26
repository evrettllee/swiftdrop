const MAX_SHOWN_COUNT = 99;

type CountBadgeProps = {
  count: number;
};

export function CountBadge({ count }: CountBadgeProps) {
  if (count <= 0) {
    return null;
  }

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -end-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full border-2 border-surface bg-primary px-1 text-caption leading-4 text-on-primary tabular-nums"
    >
      {count > MAX_SHOWN_COUNT ? `${MAX_SHOWN_COUNT}+` : count}
    </span>
  );
}
