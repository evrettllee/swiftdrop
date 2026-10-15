import { SignOutIcon } from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { useAuthStore } from '@/shared/session';
import { Button } from '@/shared/ui/button';
import { PageTitle } from '@/shared/ui/page-title';
import { ThemeToggle } from '@/shared/ui/theme-toggle';
import { PROFILE_TEXTS } from '../config/texts';

// A temporary profile: the full page comes with the addresses. The theme is chosen here,
// as the design system says, and the user signs out here.
export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <div className="flex max-w-md flex-col gap-6 lg:gap-8">
      <PageTitle>{PROFILE_TEXTS.PROFILE}</PageTitle>
      <p className="text-small text-fg-secondary">
        {PROFILE_TEXTS.PROFILE_EMAIL}: {user?.email}
      </p>
      <div className="flex items-center justify-between gap-4">
        <span>{PROFILE_TEXTS.PROFILE_THEME}</span>
        <ThemeToggle />
      </div>
      <div>
        <Button
          variant="secondary"
          icon={<SignOutIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />}
          onClick={() => void signOut()}
        >
          {PROFILE_TEXTS.SIGN_OUT}
        </Button>
      </div>
    </div>
  );
}
