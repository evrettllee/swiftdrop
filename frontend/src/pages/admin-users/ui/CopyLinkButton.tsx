import { CheckIcon, CopyIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { INVITE_STAFF_TEXTS as TEXTS } from '../config/invite-texts';

const COPIED_MS = 2_000;

const COPY_STATE = {
  IDLE: 'idle',
  COPIED: 'copied',
  FAILED: 'failed',
} as const;

type CopyState = (typeof COPY_STATE)[keyof typeof COPY_STATE];

export function CopyLinkButton({ link }: { link: string }) {
  const [state, setState] = useState<CopyState>(COPY_STATE.IDLE);
  const isCopied = state === COPY_STATE.COPIED;
  const StateIcon = isCopied ? CheckIcon : CopyIcon;

  useEffect(() => {
    if (!isCopied) {
      return undefined;
    }

    const timer = window.setTimeout(() => setState(COPY_STATE.IDLE), COPIED_MS);

    return () => window.clearTimeout(timer);
  }, [isCopied]);

  function copy(): void {
    navigator.clipboard.writeText(link).then(
      () => setState(COPY_STATE.COPIED),
      () => setState(COPY_STATE.FAILED),
    );
  }

  return (
    <div className="flex shrink-0 flex-col gap-2">
      <Button
        variant="secondary"
        icon={<StateIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />}
        onClick={copy}
      >
        {isCopied ? TEXTS.COPIED : TEXTS.COPY}
      </Button>
      <span aria-live="polite" className="sr-only">
        {isCopied ? TEXTS.COPIED : ''}
      </span>
      {state === COPY_STATE.FAILED ? (
        <p className="text-small break-all text-fg">
          {TEXTS.COPY_FAILED}: {link}
        </p>
      ) : null}
    </div>
  );
}
