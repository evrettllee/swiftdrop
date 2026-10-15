import { UI_TEXTS } from '@/shared/config';
import { APP_ROUTES } from '@/shared/routes';
import { LinkButton } from '@/shared/ui/button';
import { PLACEHOLDER_TEXTS } from '../config/texts';

type PlaceholderContentProps = {
  title: string;
  // Where the button leads: the home page of an account area inside its frame.
  homeTo?: string;
};

export function PlaceholderContent({ title, homeTo = APP_ROUTES.HOME }: PlaceholderContentProps) {
  return (
    <>
      <h1 className="text-heading-md font-semibold">{title}</h1>
      <p className="text-fg-secondary">{PLACEHOLDER_TEXTS.HINT}</p>
      <LinkButton to={homeTo}>{UI_TEXTS.BACK_HOME}</LinkButton>
    </>
  );
}
