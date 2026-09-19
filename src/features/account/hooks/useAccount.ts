import { useCallback, useEffect, useState } from 'react';

import type { UserAccount } from '../types/account.types';
import { STORAGE_KEYS, getStoredValue, setStoredValue } from '../../../services/storage/storageService';

const DEFAULT_ACCOUNT: UserAccount = {
  id: 'local-user',
  name: 'PillPing User',
  createdAt: new Date().toISOString(),
};

export function useAccount() {
  const [account, setAccount] = useState<UserAccount>(DEFAULT_ACCOUNT);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const saved = await getStoredValue<UserAccount | null>(STORAGE_KEYS.account, null);
      if (saved) {
        setAccount(saved);
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

  const updateName = useCallback(async (name: string) => {
    const next = { ...account, name: name.trim() || DEFAULT_ACCOUNT.name };
    await setStoredValue(STORAGE_KEYS.account, next);
    setAccount(next);
  }, [account]);

  return { account, loading, updateName };
}
