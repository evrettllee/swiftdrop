type AvatarProps = {
  initials: string;
};

// A round badge with the initials of the user.
export function Avatar({ initials }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-small font-semibold text-on-primary"
    >
      {initials}
    </span>
  );
}
