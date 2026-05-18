/**
 * Type declarations for nuxt-auth-utils session
 */

declare module '#auth-utils' {
  interface User {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    role: 'user' | 'admin';
    isPro: boolean;
    isBlocked: boolean;
  }

  interface UserSession {
    user: User;
    accessToken: string;
    refreshToken: string;
    loggedInAt?: string;
  }

  interface SecureSessionData {
    // Add any secure data you want to store here
  }
}

export {};
