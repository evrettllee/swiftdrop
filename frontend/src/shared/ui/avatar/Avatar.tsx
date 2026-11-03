import { joinClassNames } from '@/shared/lib/class-names';

const SIZE_CLASSES = {
  medium: 'size-10 text-small',
  small: 'size-8 text-caption',
} as const;

type AvatarProps = {
  initials: string;
  size?: keyof typeof SIZE_CLASSES;
};

// A round badge with the initials of the user.
export function Avatar({ initials, size = 'medium' }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={joinClassNames(
        'grid shrink-0 place-items-center rounded-full bg-primary font-semibold text-on-primary',
        SIZE_CLASSES[size],
      )}
    >
      {initials}
    </span>
  );
}
