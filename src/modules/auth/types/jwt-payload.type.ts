export interface JwtPayload {
  sub: string; // userId
  businessId: string;
}

export interface AuthenticatedUser {
  userId: string;
  businessId: string;
  email: string;
  name: string;
  permissions: string[];
  isSuperAdmin: boolean;
}
