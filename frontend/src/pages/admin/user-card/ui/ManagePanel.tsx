import { Fragment } from 'react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { Divider } from '@/shared/ui/divider';
import { Panel } from '@/shared/ui/panel';
import { ACTION_BUTTONS, type UserAction } from '../config/actions';
import { USER_CARD_TEXTS as TEXTS } from '../config/texts';

type ManagePanelProps = {
  groups: UserAction[][];
  onAction: (action: UserAction) => void;
};

export function ManagePanel({ groups, onAction }: ManagePanelProps) {
  return (
    <Panel title={TEXTS.MANAGEMENT}>
      <div className="flex flex-col gap-2">
        {groups.map((group, index) => (
          <Fragment key={group.join()}>
            {index === 0 ? null : (
              <div className="py-2">
                <Divider />
              </div>
            )}
            {group.map((action) => {
              const { label, icon: ActionIcon } = ACTION_BUTTONS[action];

              return (
                <Button
                  key={action}
                  variant="secondary"
                  align="start"
                  fullWidth
                  icon={
                    <ActionIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
                  }
                  onClick={() => onAction(action)}
                >
                  {label}
                </Button>
              );
            })}
          </Fragment>
        ))}
      </div>
    </Panel>
  );
}
