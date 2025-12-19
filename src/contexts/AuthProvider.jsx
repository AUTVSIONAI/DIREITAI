import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, resendConfirmation } from '../lib/supabase'
import { apiClient } from '../lib/api'
import { AuthContext } from './AuthContext'

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchingProfile, setFetchingProfile] = useState(false)

  const lastProfileFetchRef = useRef(0)

  const normalizeRole = (raw) => {
    const r = String(raw || '').toLowerCase()
    if (!r) return 'user'
    if (['admin', 'super_admin', 'moderator'].includes(r)) return r
    if (['politician', 'politico', 'político', 'politico_teste', 'politician_test'].includes(r)) return 'politician'
    if (['journalist', 'jornalista'].includes(r)) return 'journalist'
    if (['party', 'partido'].includes(r)) return 'party'
    return 'user'
  }

  const fetchUserProfile = useCallback(async (currentUser) => {
    if (!currentUser) {
      setUserProfile(null);
      return;
    }

    if (fetchingProfile) {
      return;
    }

    try {
      setFetchingProfile(true);

      const cacheKey = `user_profile_${currentUser.id}`;
      const cachedProfile = sessionStorage.getItem(cacheKey);
      const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);

      if (cachedProfile && cacheTime && (Date.now() - parseInt(cacheTime)) < 300000) {
        const parsedProfile = JSON.parse(cachedProfile);
        const metaRole = currentUser?.user_metadata?.role;
        if (!metaRole || parsedProfile?.role === metaRole) {
          setUserProfile(parsedProfile);
          return;
        }
      }

      let dbUser = null
      try {
        const now = Date.now()
        const tooSoon = (now - (lastProfileFetchRef.current || 0)) < 10000
        if (!tooSoon) {
          const resp = await apiClient.get('/auth/me')
          dbUser = resp?.data?.profile || null
          lastProfileFetchRef.current = now
        }
      } catch (e) {
        console.warn('Falha ao obter perfil via backend:', e?.message || e)
      }

      let finalProfile;

      if (!dbUser) {
        finalProfile = {
          id: currentUser.id,
          auth_id: currentUser.id,
          full_name: currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.username || 'Usuário',
          username: currentUser?.user_metadata?.username || '',
          email: currentUser?.email || '',
          avatar_url: currentUser?.user_metadata?.avatar_url || null,
          bio: currentUser?.user_metadata?.bio || '',
          city: currentUser?.user_metadata?.city || '',
          state: currentUser?.user_metadata?.state || '',
          phone: currentUser?.user_metadata?.phone || '',
          birth_date: currentUser?.user_metadata?.birth_date || '',
          is_admin: currentUser?.email === 'admin@direitai.com',
          role: normalizeRole(currentUser?.user_metadata?.role) || (currentUser?.email === 'admin@direitai.com' ? 'admin' : 'user'),
          email_confirmed_at: currentUser?.email_confirmed_at,
          party: currentUser?.user_metadata?.party || '',
          politician_id: currentUser?.user_metadata?.politician_id || null
        };
      } else {
        finalProfile = {
          id: dbUser.id,
          auth_id: currentUser.id,
          full_name: dbUser.full_name || currentUser?.user_metadata?.full_name || 'Usuário',
          username: dbUser.username || currentUser?.user_metadata?.username || '',
          email: dbUser.email || currentUser?.email || '',
          avatar_url: dbUser.avatar_url || currentUser?.user_metadata?.avatar_url || null,
          bio: dbUser.bio ?? currentUser?.user_metadata?.bio ?? '',
          city: dbUser.city ?? currentUser?.user_metadata?.city ?? '',
          state: dbUser.state ?? currentUser?.user_metadata?.state ?? '',
          phone: dbUser.phone ?? currentUser?.user_metadata?.phone ?? '',
          birth_date: dbUser.birth_date ?? currentUser?.user_metadata?.birth_date ?? '',
          is_admin: dbUser.is_admin || currentUser?.email === 'admin@direitai.com',
          email_confirmed_at: currentUser?.email_confirmed_at,
          plan: dbUser.plan || 'gratuito',
          points: dbUser.points || 0,
          role: normalizeRole(dbUser.role || currentUser?.user_metadata?.role || (dbUser.is_admin ? 'admin' : 'user')),
          party: dbUser.party || currentUser?.user_metadata?.party || '',
          politician_id: dbUser.politician_id || currentUser?.user_metadata?.politician_id || null
        };
      }

      sessionStorage.setItem(cacheKey, JSON.stringify(finalProfile));
      sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());

      setUserProfile(finalProfile);
    } catch (error) {
      console.error('Erro ao buscar/criar perfil do usuário:', error);
    } finally {
      setFetchingProfile(false);
    }
  }, [fetchingProfile]);

  useEffect(() => {
    let mounted = true;

    const handleAuthStateChange = async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user);
          // Sincronizar token com o cliente API
          const token = session?.access_token;
          if (token) {
            try { apiClient.setAuthToken(token); } catch {}
          }
          setLoading(false);
          const now = Date.now()
          const tooSoon = (now - (lastProfileFetchRef.current || 0)) < 10000
          if (!tooSoon || event === 'SIGNED_IN') {
            fetchUserProfile(session.user);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        if (user?.id) {
          const cacheKey = `user_profile_${user.id}`;
          sessionStorage.removeItem(cacheKey);
          sessionStorage.removeItem(`${cacheKey}_time`);
        }

        setUser(null);
        setUserProfile(null);
        // Limpar token do cliente API
        try { apiClient.clearAuthToken(); } catch {}
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    const initializeAuth = async () => {
      if (!mounted) return;

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !mounted) {
          if (mounted) setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          // Aplicar token inicial ao cliente API
          const token = session?.access_token;
          if (token) {
            try { apiClient.setAuthToken(token); } catch {}
          }
          setLoading(false);
          fetchUserProfile(session.user);
        } else {
          setUser(null);
          setUserProfile(null);
          if (mounted) setLoading(false);
        }
      } catch (error) {
        console.error('Erro na inicialização da autenticação:', error);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile])

  const refreshUserProfile = useCallback(async () => {
    if (user) {
      const cacheKey = `user_profile_${user.id}`;
      try {
        sessionStorage.removeItem(cacheKey);
        sessionStorage.removeItem(`${cacheKey}_time`);
      } catch {}
      await fetchUserProfile(user);
    }
  }, [user, fetchUserProfile]);

  const value = {
    user,
    userProfile,
    loading,
    refreshUserProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
