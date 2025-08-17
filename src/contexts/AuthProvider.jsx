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
      console.log('⚠️ Timeout de segurança ativado - definindo loading como false');
      setLoading(false);
    }, 5000); // 5 segundos - reduzido para resposta mais rápida
    
    return () => clearTimeout(timeout);
  }, [])

  const fetchUserProfile = useCallback(async (currentUser) => {
    try {
      console.log('🔍 Setting user profile for:', currentUser.email);
      
      // Definir perfil básico imediatamente para evitar loading infinito
      const basicProfile = {
        id: currentUser.id, // Usar auth_id como fallback
        auth_id: currentUser.id,
        full_name: currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.username || 'Usuário',
        email: currentUser?.email || '',
        is_admin: currentUser?.email === 'admin@direitai.com',
        email_confirmed_at: currentUser?.email === 'admin@direitai.com' ? new Date().toISOString() : currentUser?.email_confirmed_at
      };
      
      console.log('✅ Profile set successfully');
      setUserProfile(basicProfile);
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Erro na definição do perfil:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    console.log('🚀 Inicializando AuthProvider...');
    
    const initializeAuth = async () => {
      try {
        // Verificar se estamos em uma página pública do blog
        const isPublicBlogPage = window.location.pathname.startsWith('/blog');
        
        if (!isPublicBlogPage) {
          console.log('🔍 Obtendo usuário atual...');
        }
        
        const currentUser = await getCurrentUser();
        
        if (!isPublicBlogPage) {
          console.log('👤 Usuário atual:', currentUser?.email || 'Nenhum usuário');
        }
        
        if (mounted) {
          if (currentUser) {
            if (!isPublicBlogPage) {
              console.log('✅ Usuário encontrado, definindo estado...');
            }
            setUser(currentUser);
            await fetchUserProfile(currentUser);
          } else {
            if (!isPublicBlogPage) {
              console.log('❌ Nenhum usuário encontrado, definindo loading como false');
            }
            setUser(null);
            setUserProfile(null);
            setLoading(false);
          }
        }
      } catch (error) {
        // Não mostrar erros de auth em páginas públicas do blog
        const isPublicBlogPage = window.location.pathname.startsWith('/blog');
        if (!isPublicBlogPage) {
          console.error('❌ Erro na inicialização da auth:', error);
        }
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
      
      console.log('🔄 Auth state changed:', event, session?.user?.email);
      
      if (session?.user) {
        // Permitir login do admin sem confirmação de email
        if (!session.user.email_confirmed_at && session.user.email !== 'admin@direitai.com') {
          console.log('❌ Email not confirmed for non-admin user');
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }
        
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

  const value = {
    user,
    userProfile,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider