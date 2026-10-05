import { APP_ROUTES } from '../../../shared/constants';
import { LinkButton } from '../../../shared/ui/Button';
import { AUTH_STATUS } from '../../auth/constants';
import { useAuthStore } from '../../auth/store';
import { LANDING_SIGN_UP_ROUTE, LANDING_TEXTS } from '../constants';

type AuthActionsProps = {
  // In the mobile menu the buttons take the full width and the main action goes first.
  stacked?: boolean;
};

// Buttons of the header: a guest signs in or registers, a signed-in user opens the profile.
export function AuthActions({ stacked = false }: AuthActionsProps) {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);

  const signIn = (
    <LinkButton variant="secondary" to={APP_ROUTES.AUTH} fullWidth={stacked}>
      {LANDING_TEXTS.SIGN_IN}
    </LinkButton>
  );
  const signUp = (
    <LinkButton to={LANDING_SIGN_UP_ROUTE} fullWidth={stacked}>
      {LANDING_TEXTS.SIGN_UP}
    </LinkButton>
  );

  // While the session is being restored nothing is shown, so the wrong buttons do not flash.
  return status === AUTH_STATUS.LOADING ? null : user === null ? (
    <>
      {stacked ? signUp : signIn}
      {stacked ? signIn : signUp}
    </>
  ) : (
    <LinkButton to={APP_ROUTES.PROFILE} fullWidth={stacked}>
      {LANDING_TEXTS.PROFILE}
    </LinkButton>
  );
}
