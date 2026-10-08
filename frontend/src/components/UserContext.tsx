"use client";

/** Holds the logged-in learner's stats (hearts, streak, XP, gems) app-wide. */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, type Me } from "@/lib/api";

interface Ctx {
  me: Me | null;
  error: string | null;
  refresh: () => Promise<void>;
  setMe: (me: Me) => void;
}

const UserCtx = createContext<Ctx>({
  me: null,
  error: null,
  refresh: async () => {},
  setMe: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setMe(await api.me());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cannot reach the backend");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <UserCtx.Provider value={{ me, error, refresh, setMe }}>{children}</UserCtx.Provider>
  );
}

export const useUser = () => useContext(UserCtx);
