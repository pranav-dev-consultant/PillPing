import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { UserAccount } from '../types/account.types';
import {
  STORAGE_KEYS,
  getStoredValue,
  removeStoredValue,
  setStoredValue,
} from '../../../services/storage/storageService';

const DEFAULT_ACCOUNT: UserAccount = {
  id: 'local-user',
  name: 'PillPing User',
  createdAt: new Date().toISOString(),
  reminderSound: 'default',
  snoozeDurationMinutes: 10,
  appearance: 'system',
};

type AccountContextValue = {
  account: UserAccount;
  loading: boolean;
  updateProfile: (changes: Partial<UserAccount>) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  resetAccount: () => Promise<void>;
};

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<UserAccount>(DEFAULT_ACCOUNT);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const saved = await getStoredValue<UserAccount | null>(STORAGE_KEYS.account, null);
      if (saved) {
        setAccount({ ...DEFAULT_ACCOUNT, ...saved });
      } else {
        await setStoredValue(STORAGE_KEYS.account, DEFAULT_ACCOUNT);
        setAccount(DEFAULT_ACCOUNT);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateProfile = useCallback(async (changes: Partial<UserAccount>) => {
    const next = { ...account, ...changes };
    if (typeof changes.name === 'string') {
      next.name = changes.name.trim() || DEFAULT_ACCOUNT.name;
    }
    await setStoredValue(STORAGE_KEYS.account, next);
    setAccount(next);
  }, [account]);

  const updateName = useCallback(
    async (name: string) => updateProfile({ name }),
    [updateProfile],
  );

  const resetAccount = useCallback(async () => {
    await removeStoredValue(STORAGE_KEYS.account);
    setAccount(DEFAULT_ACCOUNT);
  }, []);

  const value = useMemo(
    () => ({ account, loading, updateProfile, updateName, resetAccount }),
    [account, loading, resetAccount, updateName, updateProfile],
  );

  return React.createElement(AccountContext.Provider, { value }, children);
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) throw new Error('useAccount must be used within AccountProvider');
  return context;
}
