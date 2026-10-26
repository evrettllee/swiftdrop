export const CHAT_SEARCH_PARAM = 'chat';
export const CHAT_SEARCH_PARAM_OPEN = '1';

export function isChatOpenIn(searchParams: URLSearchParams): boolean {
  return searchParams.get(CHAT_SEARCH_PARAM) === CHAT_SEARCH_PARAM_OPEN;
}
