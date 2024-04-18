export function safeJsonObjectParse(
  data: unknown,
): null | unknown[] | Record<string, unknown> {
  // First perform a cheap proxy to avoid calling JSON.parse on data that is clearly not a
  // JSON object or an array
  if (
    typeof data !== 'string' ||
    ['{', '['].indexOf(data.substring(0, 1)) === -1
  ) {
    return null;
  }

  // We know 'data' is a string starting with '{' or '[', so try to parse it as a valid object
  try {
    const jsonData = JSON.parse(data);
    if (jsonData && typeof jsonData === 'object') {
      return jsonData;
    }
    return null;
  } catch (_) {
    return null;
  }
}
