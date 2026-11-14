export interface PhleboAccessTokenPayload {
  sub: string;
  mobile: string;
}

export interface AuthenticatedPhlebo {
  id: string;
  mobile: string;
}
