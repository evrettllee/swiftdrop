type PriceRowProps = {
  label: string;
  value: string;
};

// One line of a price block: the name on the left, the value on the right (inside a <dl>).
export function PriceRow({ label, value }: PriceRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-fg-secondary">{label}</dt>
      <dd className="text-end font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
