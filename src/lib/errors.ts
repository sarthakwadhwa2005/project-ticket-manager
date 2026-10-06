// Shared error response types and helper functions

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'GITHUB_NOT_FOUND'
  | 'GITHUB_RATE_LIMITED'
  | 'GITHUB_NETWORK_ERROR'
  | 'INTERNAL_ERROR'
  | 'BAD_GATEWAY';

export interface ErrorDetail {
  field: string;
  message: string;
}

export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetail[];
  };
}

export function validationError(details: ErrorDetail[]): ErrorResponse {
  return {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details,
    },
  };
}

export function notFound(resource: string): ErrorResponse {
  return {
    error: {
      code: 'NOT_FOUND',
      message: `${resource} not found`,
    },
  };
}

export function githubNotFound(repo: string): ErrorResponse {
  return {
    error: {
      code: 'GITHUB_NOT_FOUND',
      message: `GitHub repository "${repo}" not found`,
    },
  };
}

export function githubRateLimited(): ErrorResponse {
  return {
    error: {
      code: 'GITHUB_RATE_LIMITED',
      message: 'GitHub API rate limit exceeded. Try adding a GITHUB_TOKEN.',
    },
  };
}

export function githubNetworkError(): ErrorResponse {
  return {
    error: {
      code: 'GITHUB_NETWORK_ERROR',
      message: 'Failed to connect to GitHub API',
    },
  };
}

export function badGateway(message: string): ErrorResponse {
  return {
    error: {
      code: 'BAD_GATEWAY',
      message,
    },
  };
}

export function internalError(message: string = 'An unexpected error occurred'): ErrorResponse {
  return {
    error: {
      code: 'INTERNAL_ERROR',
      message,
    },
  };
}