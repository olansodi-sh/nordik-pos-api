export interface JwtPayload {
  sub: string; // userId
  businessId?: string;
  membershipId?: string;
}

export interface AuthenticatedUser {
  userId: string;
  businessId?: string;
  membershipId?: string;
  email: string;
  name: string;
  permissions: string[];
  isSuperAdmin: boolean;
}
