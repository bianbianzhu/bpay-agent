export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface JWTPayload {
  sub: string;  // user_id
  email: string;
  exp: number;
  iat: number;
}
