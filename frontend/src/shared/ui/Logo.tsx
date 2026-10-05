// SVG of the mark and colors of both themes come from the design system, section 16.
export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 text-heading-md leading-none">
      <svg
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="size-8"
      >
        <path
          d="M22 4 V14 M32 2 V12 M42 4 V14"
          className="stroke-accent"
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
        />
        <polygon
          points="14,32 32,42 32,62 14,52"
          className="fill-primary-hover dark:fill-primary"
        />
        <polygon points="32,42 50,32 50,52 32,62" className="fill-primary-pressed" />
        <polygon points="32,22 50,32 32,42 14,32" className="fill-accent" />
        <polygon points="19.4,29 26.6,25 44.6,35 37.4,39" className="fill-surface dark:fill-fg" />
        <polygon points="37.4,39 44.6,35 44.6,55 37.4,59" className="fill-surface dark:fill-fg" />
      </svg>
      <span className="text-fg">
        <span className="font-medium">Swift</span>
        <span className="font-bold text-accent">Drop</span>
      </span>
    </span>
  );
}
