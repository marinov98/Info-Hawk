export interface DecodedToken {
  id: string;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
}

export interface ResetDecodedToken {
  email: string;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
}
