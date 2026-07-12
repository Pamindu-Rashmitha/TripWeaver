"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useCallback, useMemo } from "react";

export interface AuthUser {
  name: string;
  email: string;
  imageUrl: string;
}

export function useAppAuth() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const appUser: AuthUser | null = useMemo(() => {
    if (!isSignedIn || !user) return null;
    return {
      name: user.fullName || user.firstName || "",
      email: user.primaryEmailAddress?.emailAddress || "",
      imageUrl: user.imageUrl || "",
    };
  }, [isSignedIn, user]);

  const fetchToken = useCallback(async (): Promise<string | null> => {
    try {
      return await getToken();
    } catch {
      return null;
    }
  }, [getToken]);

  return {
    isLoaded,
    isSignedIn: !!isSignedIn,
    user: appUser,
    getToken: fetchToken,
  };
}
