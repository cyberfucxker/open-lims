import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    /** Set by a caller that already renders its own inline error UI (e.g. the login form). */
    suppressErrorToast?: boolean;
  }
  interface InternalAxiosRequestConfig {
    suppressErrorToast?: boolean;
    _retry?: boolean;
  }
}
