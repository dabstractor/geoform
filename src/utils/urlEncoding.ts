/**
 * URL encoding utilities for form stack state synchronization.
 * Uses comma-separated form IDs with URL encoding for special characters.
 *
 * @module urlEncoding
 */

/**
 * Encode an array of form IDs to a URL-safe query parameter value.
 * @param formIds Array of form IDs to encode
 * @returns URL-safe string (comma-separated, URI-encoded IDs)
 *
 * @example
 * ```ts
 * encodeFormStack(['org-form', 'team-form']);
 * // Returns: 'org-form,team-form'
 *
 * encodeFormStack(['form with spaces', 'form&special']);
 * // Returns: 'form%20with%20spaces,form%26special'
 * ```
 */
export function encodeFormStack(formIds: readonly string[]): string {
  if (formIds.length === 0) return '';
  return formIds.map((id) => encodeURIComponent(id)).join(',');
}

/**
 * Decode a URL query parameter value to an array of form IDs.
 * @param encoded Encoded string from URL (or null/undefined)
 * @returns Array of form IDs (empty array if invalid)
 *
 * @example
 * ```ts
 * decodeFormStack('org-form,team-form');
 * // Returns: ['org-form', 'team-form']
 *
 * decodeFormStack('form%20with%20spaces,form%26special');
 * // Returns: ['form with spaces', 'form&special']
 * ```
 */
export function decodeFormStack(encoded: string | null | undefined): string[] {
  if (!encoded || encoded.trim() === '') return [];

  try {
    return encoded
      .split(',')
      .map((id) => decodeURIComponent(id.trim()))
      .filter((id) => id.length > 0);
  } catch {
    // Invalid URI encoding - return empty array
    return [];
  }
}

/**
 * Build a URL with form stack encoded in query parameters.
 * Preserves other existing query parameters.
 * @param formIds Form IDs to encode
 * @param paramName Query parameter name (default: 'forms')
 * @returns Full URL string
 *
 * @example
 * ```ts
 * // Assuming current URL is http://localhost/app?other=value
 * buildFormStackUrl(['org-form', 'team-form']);
 * // Returns: 'http://localhost/app?other=value&forms=org-form,team-form'
 *
 * buildFormStackUrl([]);
 * // Returns: 'http://localhost/app?other=value' (forms param removed)
 * ```
 */
export function buildFormStackUrl(
  formIds: readonly string[],
  paramName: string = 'forms'
): string {
  if (typeof window === 'undefined') return '';

  const url = new URL(window.location.href);

  if (formIds.length === 0) {
    url.searchParams.delete(paramName);
  } else {
    url.searchParams.set(paramName, encodeFormStack(formIds));
  }

  return url.toString();
}

/**
 * Parse form IDs from current URL query parameters.
 * @param paramName Query parameter name (default: 'forms')
 * @returns Array of form IDs from URL
 *
 * @example
 * ```ts
 * // Assuming current URL is http://localhost/app?forms=org-form,team-form
 * parseFormStackUrl();
 * // Returns: ['org-form', 'team-form']
 * ```
 */
export function parseFormStackUrl(paramName: string = 'forms'): string[] {
  if (typeof window === 'undefined') return [];

  const params = new URLSearchParams(window.location.search);
  return decodeFormStack(params.get(paramName));
}
