import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, BookOpen, Award } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { GamificationService } from '../../services/gamification';
import { ConstitutionService } from '../../services/constitution';
import { supabase } from '../../lib/supabase';

const ConstitutionDownload = () => {
  const { user, userProfile } = useAuth();
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [userPoints, setUserPoints] = useState(null);

  useEffect(() => {
    if (userProfile?.id) {
      console.log('🔍 ConstitutionDownload - userProfile:', userProfile);
      console.log('🔍 ConstitutionDownload - using ID:', userProfile.id);
      checkDownloadStatus();
      fetchUserPoints();
    }
  }, [userProfile]);

  const checkDownloadStatus = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://direitai-backend.vercel.app/api';
      // Usar o auth_id do Supabase para as rotas de constitution-downloads
      const userId = user?.id || userProfile?.auth_id;
      const response = await fetch(`${API_BASE_URL}/constitution-downloads/users/${userId}/status`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      
      if (response.ok) {
        const status = await response.json();
        setIsDownloaded(status.hasDownloaded);
      } else {
        console.error('Erro ao verificar status:', response.status);
        // Fallback para localStorage em caso de erro
        const downloaded = localStorage.getItem('constituicao_baixada');
        if (downloaded === 'true') {
          setIsDownloaded(true);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status de download:', error);
      // Fallback para localStorage em caso de erro
      const downloaded = localStorage.getItem('constituicao_baixada');
      if (downloaded === 'true') {
        setIsDownloaded(true);
      }
    }
  };

  const fetchUserPoints = async () => {
    try {
      // Buscar o user_id correto da tabela users usando o auth_id
      const session = await supabase.auth.getSession();
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://direitai-backend.vercel.app/api';
      
      // Primeiro, buscar o user_id da tabela users
      const userResponse = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token}`
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        const userId = userData.id; // ID da tabela users
        console.log('🎮 Buscando pontos para userId da tabela users:', userId);
        const points = await GamificationService.getUserPoints(userId);
        setUserPoints(points);
      } else {
        throw new Error('Não foi possível obter dados do usuário');
      }
    } catch (error) {
      console.error('Erro ao buscar pontos:', error);
      // Definir pontos padrão em caso de erro
      setUserPoints({ total: 0, level: 1, nextLevelPoints: 100 });
    }
  };

  const handleDownload = async () => {
    if (!userProfile) {
      alert('Você precisa estar logado para baixar a Constituição!');
      return;
    }

    if (isDownloaded) {
      alert('Você já baixou a Constituição anteriormente!');
      return;
    }

    setIsDownloading(true);

    try {
      // Primeiro, registrar o download no backend
      const session = await supabase.auth.getSession();
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://direitai-backend.vercel.app/api';
      // Usar auth_id para constitution-downloads
      const authUserId = user?.id || userProfile?.auth_id;
      const response = await fetch(`${API_BASE_URL}/constitution-downloads/users/${authUserId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`
        }
      });

      if (response.status === 409) {
        // Usuário já baixou
        setIsDownloaded(true);
        localStorage.setItem('constituicao_baixada', 'true');
        alert('Você já baixou a Constituição anteriormente!');
        return;
      }

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Se o registro foi bem-sucedido, fazer o download do arquivo
      ConstitutionService.downloadPDF();
      
      // Marcar como baixado
      setIsDownloaded(true);
      localStorage.setItem('constituicao_baixada', 'true');

      // Atualizar pontos do usuário
      await fetchUserPoints();

      // Mostrar mensagem de sucesso
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);

      console.log('✅ Download registrado com sucesso:', result);

    } catch (error) {
      console.error('Erro ao baixar Constituição:', error);
      
      // Verificar se é erro de rede ou servidor
      if (error.message.includes('Failed to fetch')) {
        alert('Erro de conexão. Verifique sua internet e tente novamente.');
      } else if (error.message.includes('403')) {
        alert('Erro de autenticação. Faça login novamente.');
      } else {
        alert('Erro ao processar download. Tente novamente mais tarde.');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  if (!userProfile) {
    return null; // Não mostrar para usuários não logados
  }

  if (isDownloaded) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-800">
              ✅ Constituição baixada
            </h3>
            <p className="text-sm text-green-600">
              Missão "Verdade na Palma da Mão" concluída! Você ganhou 100 pontos.
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              +100 pontos
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mensagem de sucesso */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-pulse">
          <Award className="h-5 w-5" />
          <span className="font-medium">
            ✅ Parabéns! Você ganhou 100 pontos por baixar a Constituição!
          </span>
        </div>
      )}

      {/* Card de download */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="bg-blue-100 p-3 rounded-full">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-blue-900 mb-1">
                📘 Baixe a Constituição e ganhe 100 pontos!
              </h3>
              <p className="text-blue-700 text-sm mb-2">
                Missão: "Verdade na Palma da Mão"
              </p>
              <p className="text-blue-600 text-sm">
                Baixe gratuitamente a Constituição Federal do Brasil e ganhe pontos no sistema de gamificação.
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              {isDownloading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Baixando...</span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  <span>Baixar PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Informações de pontuação */}
        {userPoints && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex items-center justify-between text-sm">
              <div className="text-blue-600">
                Seus pontos atuais: <span className="font-semibold">{userPoints.total || 0}</span>
              </div>
              <div className="text-blue-600">
                Nível: <span className="font-semibold">{userPoints.level || 1}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ConstitutionDownload;