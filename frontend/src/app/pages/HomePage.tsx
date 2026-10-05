import { Link } from 'react-router';
import { AUTH_STATUS } from '../../features/auth/constants';
import { useAuthStore } from '../../features/auth/store';
import { APP_ROUTES } from '../../shared/constants';
import { APP_TEXTS } from '../constants';

export function HomePage() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4 py-8">
      <h1 className="text-heading-lg font-bold">{APP_TEXTS.HOME_TITLE}</h1>
      {status === AUTH_STATUS.LOADING ? null : user === null ? (
        <>
          <p className="text-fg-secondary">{APP_TEXTS.HOME_GUEST_HINT}</p>
          <Link
            to={APP_ROUTES.AUTH}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2.5 text-body text-on-primary hover:bg-primary-hover active:bg-primary-pressed"
          >
            {APP_TEXTS.SIGN_IN}
          </Link>
        </>
      ) : (
        <>
          <p>
            {APP_TEXTS.HOME_SIGNED_IN_AS} {user.firstName} {user.lastName}
          </p>
          <Link to={APP_ROUTES.PROFILE} className="text-accent underline">
            {APP_TEXTS.PROFILE}
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-accent bg-surface px-4 py-2.5 text-body text-accent hover:bg-selected"
          >
            {APP_TEXTS.SIGN_OUT}
          </button>
        </>
      )}
    </main>
  );
}
