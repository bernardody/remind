import type { UserType } from "@/features/auth/schemas";

declare module "next-auth" {
  interface User {
    accessToken: string;
    type: UserType;
    expiresIn: number;
  }

  interface Session {
    accessToken: string;
    expiresAt: number;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      type: UserType;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    accessToken?: string;
    userType?: UserType;
    expiresAt?: number;
  }
}
