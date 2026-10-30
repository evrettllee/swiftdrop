import { reassignCourierSchema, restartAssignmentSchema } from './manager-assignment.dto';

describe('reassignCourierSchema', () => {
  it('should take the expected courier, a number or null, and trim the reason', () => {
    expect(
      reassignCourierSchema.parse({ courierId: 3, expectedCourierId: 5, reason: '  Пробка  ' }),
    ).toEqual({ courierId: 3, expectedCourierId: 5, reason: 'Пробка' });
    expect(reassignCourierSchema.parse({ courierId: 3, expectedCourierId: null })).toEqual({
      courierId: 3,
      expectedCourierId: null,
      reason: null,
    });
  });

  it.each([
    [{ courierId: 3 }],
    [{ courierId: 3, expectedCourierId: '5' }],
    [{ courierId: 3, expectedCourierId: 0 }],
    [{ courierId: 3, expectedCourierId: 5, reason: '   ' }],
  ])('should refuse %j', (body) => {
    expect(reassignCourierSchema.safeParse(body).success).toBe(false);
  });
});

describe('restartAssignmentSchema', () => {
  it('should take the expected courier, a number or null', () => {
    expect(restartAssignmentSchema.parse({ expectedCourierId: null })).toEqual({
      expectedCourierId: null,
      reason: null,
    });
    expect(restartAssignmentSchema.parse({ expectedCourierId: 5, reason: 'Нет ответа' })).toEqual({
      expectedCourierId: 5,
      reason: 'Нет ответа',
    });
  });

  it.each([[undefined], [{}], [{ reason: 'Нет ответа' }], [{ expectedCourierId: 1.5 }]])(
    'should refuse %j',
    (body) => {
      expect(restartAssignmentSchema.safeParse(body).success).toBe(false);
    },
  );
});
