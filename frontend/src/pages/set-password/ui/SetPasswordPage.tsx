import { useParams } from 'react-router';
import { SET_PASSWORD_TOKEN_PARAM } from '@/shared/routes';
import { AuthFrame } from '@/shared/ui/auth-frame';
import { LINK_STATE, useSetPasswordLink } from '../model/useSetPasswordLink';
import { InvalidLink } from './InvalidLink';
import { LinkSkeleton } from './LinkSkeleton';
import { LoadFailure } from './LoadFailure';
import { SetPasswordForm } from './SetPasswordForm';

function SetPasswordContent({ token }: { token: string }) {
  const { state, retry, markInvalid } = useSetPasswordLink(token);

  switch (state.status) {
    case LINK_STATE.READY:
      return <SetPasswordForm token={token} link={state.link} onInvalid={markInvalid} />;
    case LINK_STATE.INVALID:
      return <InvalidLink />;
    case LINK_STATE.FAILED:
      return <LoadFailure onRetry={retry} />;
    default:
      return <LinkSkeleton />;
  }
}

export function SetPasswordPage() {
  const params = useParams();
  const token = params[SET_PASSWORD_TOKEN_PARAM] ?? '';

  return (
    <AuthFrame>
      <SetPasswordContent key={token} token={token} />
    </AuthFrame>
  );
}
