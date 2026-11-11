import { OPEN, setUpSupport as setUp, STAFF, state } from '@test/support/support-fakes';

describe('SupportTicketClosingService', () => {
  it('should close an open ticket as the staff and tell the staff and the author', async () => {
    const { closing, fake, log } = setUp([OPEN, state(false, 'closed')]);

    await closing.close(STAFF, 3);

    expect(fake.calls.find((call) => call.method === 'set')?.args[0]).toMatchObject({
      status: 'closed',
      closedBy: 50,
      awaitingStaff: false,
    });
    expect(log).toEqual(['commit', 'staff support:ticket', 'user support:ticket']);
  });

  it('should change nothing and tell nobody when the ticket is closed already', async () => {
    const { closing, fake, log } = setUp([[{ ticketId: 3, userId: 7, status: 'closed' }]]);

    await closing.close(STAFF, 3);

    expect(fake.calls.some((call) => call.method === 'set')).toBe(false);
    expect(log).toEqual(['commit']);
  });
});
