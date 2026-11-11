export function ZoneMark({ isActive }: { isActive: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`size-3 shrink-0 rounded-sm border-[1.5px] ${isActive ? 'border-accent bg-selected' : 'border-dashed border-fg-muted'}`}
    />
  );
}
