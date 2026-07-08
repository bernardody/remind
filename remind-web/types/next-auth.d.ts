import type { UserType } from "@/features/auth/schemas";

declare module "next-auth" {
  interface User {
    accessToken: string;
    type: UserType;
    expiresIn: number;
    profileComplete: boolean;
  }

  interface Session {
    accessToken: string;
    expiresAt: number;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      type: UserType;
      profileComplete: boolean;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    accessToken?: string;
    userType?: UserType;
    expiresAt?: number;
    profileComplete?: boolean;
  }
}
