import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, BookOpen, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GamificationService } from '../../services/gamification';
import { ConstitutionService } from '../../services/constitution';
// import { apiRequest } from '../../utils/apiClient';
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
      console.log('📱 ConstitutionDownload - User Agent:', navigator.userAgent);
      console.log('📱 ConstitutionDownload - Is Mobile:', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

      // Verificar status e pontos sem limpar cache local
      const initCheck = async () => {
        await checkDownloadStatus();
        await fetchUserPoints();
      };

      initCheck();
    }
  }, [userProfile?.id]); // Dependência mais específica
  
  // Função para limpar cache e forçar nova verificação
  const clearCacheAndRecheck = async () => {
    console.log('🧹 ConstitutionDownload - Limpando cache e reverificando...');
    localStorage.removeItem('constituicao_baixada');
    setIsDownloaded(false);
    setShowSuccess(false);
    console.log('🧹 ConstitutionDownload - Estado resetado, verificando API...');
    await checkDownloadStatus();
    await fetchUserPoints();
    console.log('🧹 ConstitutionDownload - Verificação concluída');
  };
  
  // Verificar novamente quando o componente ficar visível (para casos de cache do navegador)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && userProfile?.id) {
        console.log('🔍 ConstitutionDownload - Página ficou visível, reverificando...');
        checkDownloadStatus();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userProfile?.id]);

  const checkDownloadStatus = async () => {
    try {
      // Usar o ID da tabela users, não o auth_id
      const userId = userProfile?.id;
      if (!userId) {
        console.error('🔍 ConstitutionDownload - User ID não encontrado');
        return;
      }

      console.log('🔍 ConstitutionDownload - userProfile completo:', userProfile);
      console.log('🔍 ConstitutionDownload - Verificando status para userId:', userId);
      console.log('📱 ConstitutionDownload - localStorage antes da verificação:', localStorage.getItem('constituicao_baixada'));

      // Usar serviço unificado (axios) para compatibilidade com produção
      const status = await ConstitutionService.getDownloadStatus(userId);
      console.log('🔍 ConstitutionDownload - Status da API (service):', status);
      console.log('📱 ConstitutionDownload - hasDownloaded from API:', status.hasDownloaded);

      if (status?.hasDownloaded) {
          console.log('✅ ConstitutionDownload - Usuário JÁ BAIXOU a constituição');
          setIsDownloaded(true);
          localStorage.setItem('constituicao_baixada', 'true');
          console.log('📱 ConstitutionDownload - localStorage atualizado para true');
      } else {
          console.log('📘 ConstitutionDownload - Usuário NÃO BAIXOU a constituição');
          setIsDownloaded(false);
          localStorage.removeItem('constituicao_baixada');
          console.log('📱 ConstitutionDownload - localStorage removido');
      }
    } catch (error) {
      console.error('🔍 ConstitutionDownload - Erro ao verificar status de download:', error);
      // Em caso de erro de rede, manter estado baseado no cache local
      const cached = localStorage.getItem('constituicao_baixada') === 'true';
      setIsDownloaded(cached);
      console.log('🔍 ConstitutionDownload - Erro de rede, usando cache local:', cached);
    }
  };

  const fetchUserPoints = async () => {
    try {
      const userId = userProfile?.id;
      if (!userId) {
        throw new Error('User ID não encontrado no perfil');
      }
      console.log('🎮 Buscando pontos para userId da tabela users:', userId);
      const points = await GamificationService.getUserPoints(userId);
      setUserPoints(points);
    } catch (error) {
      console.error('Erro ao buscar pontos:', error);
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
      const userId = userProfile?.id;
      if (!userId) {
        alert('Erro: ID do usuário não encontrado');
        return;
      }

      const statusBefore = await ConstitutionService.getDownloadStatus(userId);
      if (statusBefore?.hasDownloaded) {
        setIsDownloaded(true);
        localStorage.setItem('constituicao_baixada', 'true');
        alert('Você já baixou a Constituição anteriormente!');
        return;
      }

      // Registrar via serviço unificado (axios)
      const result = await ConstitutionService.registerDownload(userId);

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
          <div className="flex-shrink-0 flex items-center space-x-2">
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              +100 pontos
            </div>
            {/* Botão de debug - remover em produção */}
            <button
              onClick={async () => {
                console.log('🔄 Forçando verificação...');
                setIsDownloaded(false);
                localStorage.removeItem('constituicao_baixada');
                await checkDownloadStatus();
              }}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded border"
              title="Forçar verificação (debug)"
            >
              🔄
            </button>
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
