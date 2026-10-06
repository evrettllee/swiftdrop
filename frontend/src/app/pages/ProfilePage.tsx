import { Link } from 'react-router';
import { useAuthStore } from '../../features/auth/store';
import { APP_ROUTES, UI_TEXTS } from '../../shared/constants';
import { APP_TEXTS } from '../constants';

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4 py-8">
      <h1 className="text-heading-md font-semibold">{APP_TEXTS.PROFILE}</h1>
      <p className="text-small text-fg-secondary">
        {APP_TEXTS.PROFILE_EMAIL}: {user?.email}
      </p>
      <p className="text-small text-fg-secondary">
        {APP_TEXTS.PROFILE_ROLE}: {user?.role}
      </p>
      <Link to={APP_ROUTES.HOME} className="text-accent underline">
        {UI_TEXTS.BACK_HOME}
      </Link>
    </main>
  );
}
