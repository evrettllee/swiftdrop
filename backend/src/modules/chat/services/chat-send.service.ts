import { ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { withLockConflict } from '../../../common/database/lock-conflict';
import {
  orderParticipant,
  type OrderParticipantActor,
  participantActor,
} from '../../../common/database/order-participant';
import type { RoleName } from '../../../common/enums/role.enum';
import { describeError } from '../../../common/utils/describe-error';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database, Transaction } from '../../../database/database.module';
import { messages } from '../../../database/schema';
import { CouriersGateway } from '../../couriers/gateways/couriers.gateway';
import { CHAT_ERROR_MESSAGES, CHAT_SOCKET_EVENTS } from '../constants/chat.constants';
import { canSendInOrder, toChatMessage } from '../mappers/chat-message.mapper';
import type { ChatMessage, MessageNewEvent, SentChatMessage } from '../types/chat.types';

@Injectable()
export class ChatSendService {
  private readonly logger = new Logger(ChatSendService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly gateway: CouriersGateway,
  ) {}

  // The message is saved while the order row is held, so it lands either before the order is
  // delivered or cancelled, or not at all (409). The room hears of it only after the commit.
  async send(
    user: { role: RoleName; userId: number },
    orderId: number,
    content: string,
  ): Promise<SentChatMessage> {
    const actor = participantActor(user.role, user.userId);

    if (!actor) {
      throw new NotFoundException(CHAT_ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    const message = await withLockConflict(
      () => this.db.transaction((tx) => this.save(tx, actor, orderId, content)),
      CHAT_ERROR_MESSAGES.BUSY,
    );
    this.publish(orderId, message);

    return { message };
  }

  private async save(
    tx: Transaction,
    actor: OrderParticipantActor,
    orderId: number,
    content: string,
  ): Promise<ChatMessage> {
    const participant = await orderParticipant(tx, orderId, actor, { lockOrder: true });
    const receiverId = participant?.counterpartUserId ?? null;

    if (!participant) {
      throw new NotFoundException(CHAT_ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    if (receiverId === null || !canSendInOrder(participant.status, true)) {
      throw new ConflictException(CHAT_ERROR_MESSAGES.CHAT_CLOSED);
    }

    const [row] = await tx
      .insert(messages)
      .values({ senderId: actor.userId, receiverId, orderId, content })
      .returning({
        messageId: messages.messageId,
        senderId: messages.senderId,
        content: messages.content,
        sentAt: messages.sentAt,
        isRead: messages.isRead,
      });

    return toChatMessage(row, participant.clientUserId);
  }

  // A room that cannot be told does not undo a saved message: the other side reads it with the
  // history. The log names ids only, never the text.
  private publish(orderId: number, message: ChatMessage): void {
    const event: MessageNewEvent = { orderId, message };

    try {
      this.gateway.emitToOrder(orderId, CHAT_SOCKET_EVENTS.MESSAGE_NEW, event);
    } catch (error) {
      this.logger.error(
        `Message ${message.messageId} of order ${orderId} not sent to the room: ${describeError(error)}`,
      );
    }
  }
}
