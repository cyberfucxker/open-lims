/** Mirrors how the real API surfaces failures (`AppApiResponseBody.status === false`) so
 *  Phase-1 error states are wired against the same shape Phase-2's axios interceptor will use. */
export class MockApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MockApiError";
  }
}
