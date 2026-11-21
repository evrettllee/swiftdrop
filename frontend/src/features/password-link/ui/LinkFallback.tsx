import { InlineAlert } from '@/shared/ui/inline-alert';
import { PASSWORD_LINK_TEXTS as TEXTS } from '../config/texts';
import { CopyLinkButton } from './CopyLinkButton';

type LinkFallbackProps = {
  link: string;
  emailSent: boolean;
};

export function LinkFallback({ link, emailSent }: LinkFallbackProps) {
  return (
    <>
      {emailSent ? null : <InlineAlert variant="warning">{TEXTS.NOT_SENT}</InlineAlert>}
      <div className="flex flex-col gap-3 rounded-xl bg-selected p-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-small font-semibold text-fg">{TEXTS.FALLBACK_TITLE}</p>
          <p className="text-small text-fg-secondary">{TEXTS.FALLBACK_TEXT}</p>
        </div>
        <CopyLinkButton link={link} />
      </div>
    </>
  );
}
