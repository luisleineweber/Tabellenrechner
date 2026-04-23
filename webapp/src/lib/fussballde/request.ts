const REQUEST_TIMEOUT_MS = 8000;
const MAX_FETCH_ATTEMPTS = 2;
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const USER_AGENT = "Mozilla/5.0 Tabellenrechner";

class UpstreamFetchError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
  }
}

type UpstreamRequestOptions = {
  cache: RequestCache;
  errorBase: string;
  timeoutMs?: number;
  maxAttempts?: number;
};

function isRetryableStatus(status: number): boolean {
  return RETRYABLE_STATUS_CODES.has(status);
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof UpstreamFetchError) {
    return error.retryable;
  }

  return error instanceof Error;
}

function formatErrorMessage(base: string, detail?: string | number): string {
  return detail ? `${base} (${detail}).` : `${base}.`;
}

async function waitBeforeRetry(attempt: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, attempt * 250));
}

async function fetchUpstreamResponse(
  url: string,
  options: UpstreamRequestOptions,
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const maxAttempts = options.maxAttempts ?? MAX_FETCH_ATTEMPTS;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        cache: options.cache,
        headers: {
          "user-agent": USER_AGENT,
        },
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        const retryable = isRetryableStatus(response.status);

        if (retryable && attempt < maxAttempts) {
          await waitBeforeRetry(attempt);
          continue;
        }

        throw new UpstreamFetchError(
          formatErrorMessage(options.errorBase, response.status),
          retryable,
        );
      }

      return response;
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error(formatErrorMessage(options.errorBase));

      if (!isRetryableError(error) || attempt >= maxAttempts) {
        break;
      }

      await waitBeforeRetry(attempt);
    }
  }

  if (lastError?.message?.startsWith(options.errorBase)) {
    throw lastError;
  }

  throw new Error(formatErrorMessage(options.errorBase, lastError?.message));
}

export async function fetchUpstreamText(
  url: string,
  options: Omit<UpstreamRequestOptions, "cache"> & { cache?: RequestCache },
): Promise<string> {
  const response = await fetchUpstreamResponse(url, {
    cache: options.cache ?? "no-store",
    errorBase: options.errorBase,
    timeoutMs: options.timeoutMs,
    maxAttempts: options.maxAttempts,
  });

  return response.text();
}

export async function fetchUpstreamBuffer(
  url: string,
  options: Omit<UpstreamRequestOptions, "cache"> & { cache?: RequestCache },
): Promise<Buffer> {
  const response = await fetchUpstreamResponse(url, {
    cache: options.cache ?? "force-cache",
    errorBase: options.errorBase,
    timeoutMs: options.timeoutMs,
    maxAttempts: options.maxAttempts,
  });

  return Buffer.from(await response.arrayBuffer());
}
