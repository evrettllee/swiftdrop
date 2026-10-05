type ResponseWithStatus = { status: number };

export function sortedStatuses(responses: ResponseWithStatus[]): number[] {
  return responses.map((response) => response.status).sort((first, second) => first - second);
}
