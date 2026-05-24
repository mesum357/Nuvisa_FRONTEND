/**
 * Nest API errors use status "error" with details in data.results.error.
 * The top-level message is often the generic string "HttpException".
 */
function formatMessageValue(value) {
  if (value == null) return "";
  if (Array.isArray(value)) {
    return value
      .map((item) => formatMessageValue(item))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object") {
    return formatMessageValue(
      value.message || value.error || value.statusCode || value.detail
    );
  }
  const text = String(value).trim();
  return text && text !== "HttpException" ? text : "";
}

export function extractPaymentApiError(response, caughtError) {
  const results = response?.data?.data?.results ?? response?.data?.results;

  const resultsErrorText = formatMessageValue(results?.error);
  if (resultsErrorText) return resultsErrorText;

  const topMessage = formatMessageValue(response?.data?.message);
  if (topMessage) return topMessage;

  const statusMessage = formatMessageValue(response?.data?.statusMessage);
  if (statusMessage) return statusMessage;

  if (caughtError?.code === "ECONNABORTED") {
    return "Payment request timed out. Please try again.";
  }

  if (caughtError?.message && caughtError.message !== "HttpException") {
    return caughtError.message;
  }

  return "";
}
