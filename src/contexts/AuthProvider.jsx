import React, { useState, useEffect, useCallback } from 'react'
import { supabase, getCurrentUser, resendConfirmation } from '../lib/supabase'
import { AuthContext } from './AuthContext'

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Timeout de segurança para garantir que loading nunca fique infinito
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000); // 5 segundos
    
    return () => clearTimeout(timeout);
  }, [])

  const fetchUserProfile = async (currentUser) => {
    try {
      // Usar apenas dados básicos do Supabase Auth para evitar loops infinitos
      const basicProfile = {
        id: currentUser.id,
        auth_id: currentUser.id,
        full_name: currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.username || 'Usuário',
        username: currentUser?.user_metadata?.username || '',
        email: currentUser?.email || '',
        avatar_url: currentUser?.user_metadata?.avatar_url || null,
        is_admin: currentUser?.email === 'admin@direitai.com',
        email_confirmed_at: currentUser?.email === 'admin@direitai.com' ? new Date().toISOString() : currentUser?.email_confirmed_at
      };
      setUserProfile(basicProfile);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erro ao definir perfil:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        
        if (mounted) {
          if (currentUser) {
            setUser(currentUser);
            await fetchUserProfile(currentUser);
          } else {
            setUser(null);
            setUserProfile(null);
            setLoading(false);
          }
        }
      } catch (error) {
        if (mounted) {
          setUser(null);
          setUserProfile(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (event === 'TOKEN_REFRESHED') {
        return;
      }
      
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [])

  const refreshUserProfile = useCallback(async () => {
    if (user) {
      // Atualizar apenas com dados básicos para evitar loops
      const basicProfile = {
        id: user.id,
        auth_id: user.id,
        full_name: user?.user_metadata?.full_name || user?.user_metadata?.username || 'Usuário',
        username: user?.user_metadata?.username || '',
        email: user?.email || '',
        avatar_url: user?.user_metadata?.avatar_url || null,
        is_admin: user?.email === 'admin@direitai.com',
        email_confirmed_at: user?.email === 'admin@direitai.com' ? new Date().toISOString() : user?.email_confirmed_at
      };
      setUserProfile(basicProfile);
    }
  }, [user]);

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