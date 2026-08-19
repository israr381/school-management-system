import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { fetchCurrentUser, getAccessToken } from "./auth";

function normalizePermissions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

const ssrSafeStorage = createJSONStorage(() => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
  }
  return localStorage;
});

interface RbacState {
  permissions: string[];
  isLoading: boolean;
  loadedFromApi: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  loadPermissions: () => Promise<void>;
  clearPermissions: () => void;
}

export const useRbacStore = create<RbacState>()(
  persist(
    (set, get) => ({
      permissions: [],
      isLoading: true,
      loadedFromApi: false,
      hasPermission: (permission) => get().permissions.includes(permission),
      hasAnyPermission: (permissions) =>
        permissions.some((permission) => get().permissions.includes(permission)),
      hasAllPermissions: (permissions) =>
        permissions.length > 0 &&
        permissions.every((permission) => get().permissions.includes(permission)),
      loadPermissions: async () => {
        const token = getAccessToken();
        if (!token) {
          set({ permissions: [], isLoading: false, loadedFromApi: true });
          return;
        }

        set({ isLoading: true });
        try {
          const data = await fetchCurrentUser(token);
          set({
            permissions: normalizePermissions(data.permissions),
            isLoading: false,
            loadedFromApi: true,
          });
        } catch (error) {
          console.error("Failed to load permissions:", error);
          set({ permissions: [], isLoading: false, loadedFromApi: true });
        }
      },
      clearPermissions: () =>
        set({ permissions: [], isLoading: false, loadedFromApi: true }),
    }),
    {
      name: "rbac-permissions",
      storage: ssrSafeStorage,
      partialize: (state) => ({ permissions: state.permissions }),
      merge: (persistedState, currentState) => {
        if (currentState.loadedFromApi) {
          return currentState;
        }

        const persisted = persistedState as { permissions?: unknown } | undefined;
        return {
          ...currentState,
          permissions: normalizePermissions(persisted?.permissions),
        };
      },
    },
  ),
);
