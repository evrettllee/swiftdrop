import { joinClassNames } from '@/shared/lib/class-names';

const SIZE_CLASSES = {
  large: 'size-14 text-heading-sm',
  medium: 'size-10 text-small',
  small: 'size-8 text-caption',
} as const;

const TONE_CLASSES = {
  primary: 'bg-primary text-on-primary',
  muted: 'bg-field text-fg-secondary',
} as const;

type AvatarProps = {
  initials: string;
  size?: keyof typeof SIZE_CLASSES;
  tone?: keyof typeof TONE_CLASSES;
};

// A round badge with the initials of the user.
export function Avatar({ initials, size = 'medium', tone = 'primary' }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={joinClassNames(
        'grid shrink-0 place-items-center rounded-full font-semibold',
        TONE_CLASSES[tone],
        SIZE_CLASSES[size],
      )}
    >
      {initials}
    </span>
  );
}
