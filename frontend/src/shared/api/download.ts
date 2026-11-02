import { ApiError, type HttpOptions, sendOk } from './http';
import {
  API_ERROR_MESSAGES,
  CONTENT_DISPOSITION_HEADER,
  HTTP_METHOD,
  NETWORK_ERROR_STATUS,
} from './request-config';

export type DownloadedFile = {
  blob: Blob;
  contentDisposition: string | null;
};

export async function downloadFile(
  path: string,
  options: HttpOptions = {},
): Promise<DownloadedFile> {
  const response = await sendOk(path, { ...options, method: HTTP_METHOD.GET });

  try {
    return {
      blob: await response.blob(),
      contentDisposition: response.headers.get(CONTENT_DISPOSITION_HEADER),
    };
  } catch (error) {
    throw options.signal?.aborted === true
      ? error
      : new ApiError(NETWORK_ERROR_STATUS, API_ERROR_MESSAGES.NETWORK);
  }
}
