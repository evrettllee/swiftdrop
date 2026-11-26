import type { Page, Route } from '@playwright/test';

const CANDIDATES_URL = /\/api\/manager\/orders\/(\d+)\/candidates(\?.*)?$/;
const ACTION_URL = /\/api\/manager\/orders\/(\d+)\/(assign|reassign|restart-assignment|cancel)$/;

type Candidate = {
  courierId: number;
  name: string;
  vehicleType: string | null;
  pickupDistanceM: number | null;
  positionAgeSec: number | null;
  hasOpenOffer: boolean;
};

function candidate(
  courierId: number,
  name: string,
  vehicleType: string,
  pickupDistanceM: number | null,
  patch: Partial<Candidate> = {},
): Candidate {
  return {
    courierId,
    name,
    vehicleType,
    pickupDistanceM,
    positionAgeSec: 12,
    hasOpenOffer: false,
    ...patch,
  };
}

export const SUITABLE: Candidate[] = [
  candidate(12, 'Андрей Король', 'car', 3400),
  candidate(2, 'Егор Тарасевич', 'scooter', 2600, { hasOpenOffer: true }),
  candidate(3, 'Марина Лобач', 'bicycle', 3100),
  candidate(4, 'Игорь Рыбак', 'foot', 1900),
];

export const UNSUITABLE = [
  { ...candidate(5, 'Алина Гордей', 'scooter', 2200), reasons: ['busy'] },
  { ...candidate(6, 'Никита Волчек', 'car', null), reasons: ['offline', 'stale_location'] },
];

export type ActionPost = { orderId: number; action: string; body: unknown };

export type ActionFailureStub = { status: number; body?: object } | 'network';

export type ActionsStub = {
  suitable: Candidate[];
  unsuitable: typeof UNSUITABLE;
  candidateRequests: URL[];
  posts: ActionPost[];
  refund: 'none' | 'pending' | 'refunded';
  failures: ActionFailureStub[];
  hold: Promise<void> | null;
};

function successBody(stub: ActionsStub, orderId: number, action: string, body: unknown) {
  if (action === 'cancel') {
    return { orderId, status: 'cancelled', refund: stub.refund };
  }

  if (action === 'restart-assignment') {
    return { orderId, status: 'confirmed' };
  }

  return { orderId, courierId: (body as { courierId: number }).courierId };
}

async function answerAction(stub: ActionsStub, route: Route, match: RegExpExecArray) {
  const orderId = Number(match[1]);
  const action = match[2];
  const body: unknown = route.request().postDataJSON();
  stub.posts.push({ orderId, action, body });
  await stub.hold;
  const failure = stub.failures.shift();

  if (failure === 'network') {
    return route.abort('failed');
  }

  return failure === undefined
    ? route.fulfill({ json: successBody(stub, orderId, action, body) })
    : route.fulfill({
        status: failure.status,
        json: { statusCode: failure.status, ...failure.body },
      });
}

export async function stubOrderActions(page: Page): Promise<ActionsStub> {
  const stub: ActionsStub = {
    suitable: [...SUITABLE],
    unsuitable: [...UNSUITABLE],
    candidateRequests: [],
    posts: [],
    refund: 'refunded',
    failures: [],
    hold: null,
  };

  await page.route(CANDIDATES_URL, (route) => {
    stub.candidateRequests.push(new URL(route.request().url()));

    return route.fulfill({ json: { suitable: stub.suitable, unsuitable: stub.unsuitable } });
  });
  await page.route(ACTION_URL, (route) => {
    const match = ACTION_URL.exec(new URL(route.request().url()).pathname);

    return match === null ? route.continue() : answerAction(stub, route, match);
  });

  return stub;
}

export function lastCandidateQuery(stub: ActionsStub): URLSearchParams {
  return stub.candidateRequests.at(-1)?.searchParams ?? new URLSearchParams();
}
