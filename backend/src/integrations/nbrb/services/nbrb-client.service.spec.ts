import { NbrbClient } from './nbrb-client.service';

const RATE_BODY = { Cur_Scale: 1, Cur_OfficialRate: 3.0371 };

function buildResponse(body: unknown, status = 200): Response {
  return { ok: status === 200, status, json: () => Promise.resolve(body) } as unknown as Response;
}

describe('NbrbClient', () => {
  let client: NbrbClient;
  let fetchMock: jest.SpiedFunction<typeof globalThis.fetch>;

  beforeEach(() => {
    client = new NbrbClient();
    fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(buildResponse(RATE_BODY));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return the official rate when NBRB answers', async () => {
    expect(await client.fetchUsdRate()).toBe(3.0371);
  });

  it('should divide the rate by the scale when the rate is given for several units', async () => {
    fetchMock.mockResolvedValue(buildResponse({ Cur_Scale: 100, Cur_OfficialRate: 303.71 }));

    expect(await client.fetchUsdRate()).toBeCloseTo(3.0371, 4);
  });

  it('should fail when NBRB answers with an error status', async () => {
    fetchMock.mockResolvedValue(buildResponse({}, 500));

    await expect(client.fetchUsdRate()).rejects.toThrow('NBRB answered with status 500');
  });

  it('should fail when the NBRB answer has no usable rate', async () => {
    fetchMock.mockResolvedValue(buildResponse({ Cur_Scale: 1 }));

    await expect(client.fetchUsdRate()).rejects.toThrow();
  });
});
