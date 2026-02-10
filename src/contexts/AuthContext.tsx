import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChange, getCurrentUser, type AppwriteUser } from '@/api/appwrite';

interface AuthContextType {
  session: { user: AppwriteUser } | null;
  user: AppwriteUser | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppwriteUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error refreshing session:', error);
      setUser(null);
    }
  };

  useEffect(() => {
    // Initial session load
    const loadSession = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    // Subscribe to auth changes
    const { data: { subscription } } = onAuthStateChange(
      async (event, sessionData) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (sessionData?.user) {
          setUser(sessionData.user);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const session = user ? { user } : null;

  const value = {
    session,
    user,
    loading,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export a hook that guarantees a user is logged in
export function useAuthRequired() {
  const auth = useAuth();

  if (!auth.loading && !auth.user) {
    throw new Error('Authentication required');
  }

  return auth as AuthContextType & { user: AppwriteUser };
}
