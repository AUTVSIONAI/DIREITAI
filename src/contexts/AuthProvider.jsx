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
      console.log('🔍 AuthProvider - Buscando perfil para auth_id:', currentUser.id);
      
      // Buscar o perfil real do usuário na tabela users usando auth_id
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', currentUser.id)
        .single();
      
      if (dbError || !dbUser) {
        console.error('❌ AuthProvider - Usuário não encontrado na tabela users:', dbError?.message);
        // Fallback para dados básicos do auth se não encontrar na tabela users
        const basicProfile = {
          id: currentUser.id, // Usar auth_id como fallback
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
        return;
      }
      
      console.log('✅ AuthProvider - Usuário encontrado na tabela users:', dbUser.email, 'ID:', dbUser.id);
      
      // Usar dados reais da tabela users
      const realProfile = {
        id: dbUser.id, // ID da tabela users (importante para foreign keys)
        auth_id: currentUser.id, // ID do auth.users
        full_name: dbUser.full_name || currentUser?.user_metadata?.full_name || 'Usuário',
        username: dbUser.username || currentUser?.user_metadata?.username || '',
        email: dbUser.email || currentUser?.email || '',
        avatar_url: dbUser.avatar_url || currentUser?.user_metadata?.avatar_url || null,
        is_admin: dbUser.is_admin || currentUser?.email === 'admin@direitai.com',
        email_confirmed_at: currentUser?.email_confirmed_at,
        plan: dbUser.plan || 'gratuito',
        points: dbUser.points || 0,
        role: dbUser.role || (dbUser.is_admin ? 'admin' : 'user')
      };
      
      setUserProfile(realProfile);
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
      await fetchUserProfile(user);
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