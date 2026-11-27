import { MANAGED_ROLE } from '@/entities/admin-user';
import {
  type AdminUserCard,
  blockUser,
  changeRole,
  deleteUser,
  endSessions,
  resendInvite,
  resetPassword,
  unblockUser,
  updateStaff,
} from '../../api/admin-user-card';
import { LINK_KIND, USER_ACTION, type UserAction } from '../../config/actions';
import { DIALOG_TEXTS as TEXTS } from '../../config/dialog-texts';
import { BlockDialog } from './BlockDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { EditDialog } from './EditDialog';
import { LinkActionDialog } from './LinkActionDialog';

type CardDialogProps = {
  card: AdminUserCard;
  action: UserAction;
  isOpen: boolean;
  onClose: () => void;
  onCard: (card: AdminUserCard) => void;
  onReload: () => void;
};

function roleDialogText(card: AdminUserCard, name: string): string {
  return card.role === MANAGED_ROLE.COURIER ? TEXTS.toManager(name) : TEXTS.toCourier(name);
}

function CardDialog({ card, action, isOpen, onClose, onCard, onReload }: CardDialogProps) {
  const { userId } = card;
  const name = `${card.firstName} ${card.lastName}`;
  const done = (next: AdminUserCard) => {
    onCard(next);
    onClose();
  };
  const linkDone = () => {
    onClose();
    onReload();
  };
  const common = { isOpen, onClose, onDone: done };

  switch (action) {
    case USER_ACTION.EDIT:
      return <EditDialog {...common} card={card} run={(changes) => updateStaff(userId, changes)} />;
    case USER_ACTION.BLOCK:
      return <BlockDialog {...common} name={name} run={(reason) => blockUser(userId, reason)} />;
    case USER_ACTION.RESET:
    case USER_ACTION.RESEND:
      return (
        <LinkActionDialog
          kind={action === USER_ACTION.RESET ? LINK_KIND.RESET : LINK_KIND.RESEND}
          email={card.email}
          isOpen={isOpen}
          onClose={onClose}
          onDone={linkDone}
          run={() => (action === USER_ACTION.RESET ? resetPassword(userId) : resendInvite(userId))}
        />
      );
    case USER_ACTION.ROLE:
      return (
        <ConfirmDialog
          {...common}
          title={TEXTS.ROLE_TITLE}
          text={roleDialogText(card, name)}
          confirmLabel={TEXTS.ROLE_CONFIRM}
          run={() =>
            changeRole(
              userId,
              card.role === MANAGED_ROLE.COURIER ? MANAGED_ROLE.MANAGER : MANAGED_ROLE.COURIER,
            )
          }
        />
      );
    case USER_ACTION.UNBLOCK:
      return (
        <ConfirmDialog
          {...common}
          title={TEXTS.UNBLOCK_TITLE}
          text={
            card.role === MANAGED_ROLE.CLIENT ? TEXTS.unblockClient(name) : TEXTS.unblockStaff(name)
          }
          confirmLabel={TEXTS.UNBLOCK_CONFIRM}
          run={() => unblockUser(userId)}
        />
      );
    case USER_ACTION.SESSIONS:
      return (
        <ConfirmDialog
          {...common}
          title={TEXTS.SESSIONS_TITLE}
          text={TEXTS.sessions(name)}
          confirmLabel={TEXTS.SESSIONS_CONFIRM}
          run={() => endSessions(userId)}
        />
      );
    default:
      return (
        <ConfirmDialog
          {...common}
          title={TEXTS.DELETE_TITLE}
          text={TEXTS.DELETE_TEXT}
          confirmLabel={TEXTS.DELETE_CONFIRM}
          isDanger
          run={() => deleteUser(userId)}
        />
      );
  }
}

type CardDialogsProps = {
  card: AdminUserCard;
  shown: UserAction | null;
  isOpen: boolean;
  opening: number;
  onClose: () => void;
  onCard: (card: AdminUserCard) => void;
  onReload: () => void;
};

export function CardDialogs({ shown, opening, ...rest }: CardDialogsProps) {
  return shown === null ? null : <CardDialog key={opening} action={shown} {...rest} />;
}
