import React, { useState, useRef, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  X, 
  CheckCircle, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  FileText, 
  Send, 
  Loader, 
  ThumbsUp, 
  ThumbsDown, 
  Flag, 
  ExternalLink,
  Clock,
  TrendingUp,
  History,
  ArrowLeft,
  Search,
  Filter,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Share2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { apiRequest } from '../utils/apiClient';
import LimitReached from '../components/user/modals/LimitReached';

interface AnalysisResult {
  id: string;
  resultado: 'verdade' | 'tendencioso' | 'fake';
  confianca: number;
  explicacao: string;
  fontes: string[];
  created_at: string;
}

interface HistoryItem {
  id: string;
  tipo_input: string;
  conteudo: string;
  resultado: 'verdade' | 'tendencioso' | 'fake';
  confianca: number;
  created_at: string;
  explicacao?: string;
  fontes?: string[];
}

interface VerificacaoHistorico {
  id: string;
  tipo_input: 'texto' | 'link' | 'imagem';
  conteudo: string;
  resultado: 'verdade' | 'tendencioso' | 'fake';
  explicacao: string;
  confianca: number;
  fontes: Array<{ nome: string; url: string; confiabilidade: string }>;
  feedback_positivo: number;
  feedback_negativo: number;
  denuncias: number;
  created_at: string;
}

const VerdadeOuFake = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inputType, setInputType] = useState<'texto' | 'link' | 'imagem'>('texto');
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [fullHistory, setFullHistory] = useState<VerificacaoHistorico[]>([]);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResult, setFilterResult] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedVerificacao, setSelectedVerificacao] = useState<VerificacaoHistorico | null>(null);
  const [loadingFullHistory, setLoadingFullHistory] = useState(false);
  const itemsPerPage = 10;
  const [error, setError] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [stats, setStats] = useState({
    total_verificacoes: 0,
    verificacoes_semana: 0,
    por_resultado: { verdade: 0, tendencioso: 0, fake: 0 }
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [userPlan, setUserPlan] = useState('gratuito');
  const [limitInfo, setLimitInfo] = useState({});

  const getResultIcon = (resultado: string) => {
    switch (resultado) {
      case 'verdade':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'tendencioso':
        return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
      case 'fake':
        return <X className="w-8 h-8 text-red-500" />;
      default:
        return <Shield className="w-8 h-8 text-gray-500" />;
    }
  };

  const getResultColor = (resultado: string) => {
    switch (resultado) {
      case 'verdade':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'tendencioso':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'fake':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getResultLabel = (resultado: string) => {
    switch (resultado) {
      case 'verdade':
        return '✅ VERDADE';
      case 'tendencioso':
        return '⚠️ TENDENCIOSO';
      case 'fake':
        return '❌ FAKE NEWS';
      default:
        return 'ANALISANDO...';
    }
  };

  // Função para comprimir imagem
  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converter para base64 com compressão
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        try {
          // Comprimir imagem antes de definir o conteúdo
          const compressedImage = await compressImage(file, 800, 0.7);
          setContent(compressedImage);
        } catch (error) {
          console.error('Erro ao comprimir imagem:', error);
          setError('Erro ao processar a imagem. Tente novamente.');
        }
      } else {
        setError('Por favor, selecione apenas arquivos de imagem.');
      }
    }
  };

  const analyzeContent = async () => {
    if (!content.trim()) {
      setError('Por favor, insira o conteúdo a ser analisado.');
      return;
    }

    if (!user) {
      setError('Você precisa estar logado para usar esta funcionalidade.');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setResult(null);
    setFeedbackGiven(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('Sessão expirada. Faça login novamente.');
        return;
      }

      const response = await apiRequest('fake-news/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          content,
          type: inputType
        })
      });

      if (!response.success) {
        // Verificar se é erro de limite atingido
        if (response.error && response.error.includes('limite diário')) {
          setLimitInfo({
            limit: response.limit || 'N/A',
            used: response.used || 'N/A'
          });
          setShowLimitModal(true);
          return;
        }
        throw new Error(response.error || 'Erro ao analisar conteúdo');
      }

      setResult(response.data);
      loadHistory(); // Recarregar histórico
    } catch (err: any) {
      setError(err.message || 'Erro ao analisar conteúdo');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadHistory = async () => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.log('No session available for history');
        return;
      }

      const response = await apiRequest('fake-news/history?limit=5', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.success) {
        setHistory(response.data?.verificacoes || []);
      }
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    }
  };

  const loadFullHistory = async () => {
    if (!user) return;

    try {
      setLoadingFullHistory(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('Sessão expirada. Faça login novamente.');
        setLoadingFullHistory(false);
        return;
      }
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterResult && { resultado: filterResult }),
        ...(filterType && { tipo: filterType })
      });

      const response = await apiRequest(`fake-news/history?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.success) {
        setFullHistory(response.data?.verificacoes || []);
        setTotalPages(Math.ceil((response.data?.total || 0) / itemsPerPage));
      } else {
        setError(response.error || 'Erro ao carregar histórico completo');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoadingFullHistory(false);
    }
  };

  const deleteVerificacao = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta verificação?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        alert('Sessão expirada. Faça login novamente.');
        return;
      }

      const response = await apiRequest(`fake-news/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.success) {
        setFullHistory(prev => prev.filter(v => v.id !== id));
        loadHistory(); // Atualizar histórico resumido também
      } else {
        alert('Erro ao excluir verificação');
      }
    } catch (err) {
      alert('Erro ao conectar com o servidor');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const loadStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setLoadingStats(false);
        return;
      }

      const response = await apiRequest('fake-news/stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.success && response.data) {
        setStats({
          total_verificacoes: response.data.total_verificacoes || 0,
          verificacoes_semana: response.data.verificacoes_semana || 0,
          por_resultado: response.data.por_resultado || { verdade: 0, tendencioso: 0, fake: 0 }
        });
      } else if (response.error) {
        console.error('Erro ao carregar estatísticas:', response.error);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const giveFeedback = async (tipo: 'concordo' | 'discordo') => {
    if (!result || !user || feedbackGiven) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.log('No session available for feedback');
        return;
      }

      const response = await apiRequest(`fake-news/${result.id}/feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipo_feedback: tipo,
          comentario: ''
        })
      });

      if (response.ok) {
        setFeedbackGiven(true);
        const successMessage = tipo === 'concordo' 
          ? 'Obrigado pelo feedback positivo!' 
          : 'Obrigado pelo feedback. Vamos melhorar nossa análise.';
        
        // Mostrar mensagem de sucesso para o usuário
        const messageDiv = document.createElement('div');
        messageDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        messageDiv.textContent = successMessage;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
          document.body.removeChild(messageDiv);
        }, 3000);
      }
    } catch (err) {
      console.error('Erro ao enviar feedback:', err);
      
      // Mostrar mensagem de erro
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      errorDiv.textContent = 'Erro ao enviar feedback. Tente novamente.';
      document.body.appendChild(errorDiv);
      
      setTimeout(() => {
        document.body.removeChild(errorDiv);
      }, 3000);
    }
  };

  const reportContent = async () => {
    if (!result || !user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.log('No session available for report');
        return;
      }

      const response = await apiRequest(`fake-news/${result.id}/feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipo_feedback: 'denuncia',
          comentario: 'Conteúdo denunciado pelo usuário'
        })
      });

      if (response.ok) {
        alert('Conteúdo denunciado com sucesso. Nossa equipe irá revisar.');
      }
    } catch (error) {
      console.error('Erro ao denunciar conteúdo:', error);
      alert('Erro ao enviar denúncia. Tente novamente.');
    }
  };

  const shareAnalysis = async () => {
    if (!result) return;

    const resultText = result.resultado === 'verdade' ? 'VERDADE' : 
                      result.resultado === 'fake' ? 'FAKE NEWS' : 'TENDENCIOSO';
    
    const shareText = `🔍 Análise DireitAI - ${resultText}\n\n` +
                     `Confiança: ${result.confianca}%\n\n` +
                     `${result.explicacao}\n\n` +
                     `Verificado em: ${new Date(result.created_at).toLocaleDateString('pt-BR')}\n\n` +
                     `#DireitAI #FakeNews #FactCheck`;

    try {
      if (navigator.share) {
        // API Web Share (mobile)
        await navigator.share({
          title: `Análise DireitAI - ${resultText}`,
          text: shareText,
          url: window.location.href
        });
      } else {
        // Fallback: copiar para clipboard
        await navigator.clipboard.writeText(shareText);
        
        // Mostrar mensagem de sucesso
        const messageDiv = document.createElement('div');
        messageDiv.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        messageDiv.textContent = 'Análise copiada para a área de transferência!';
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
          document.body.removeChild(messageDiv);
        }, 3000);
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      
      // Mostrar mensagem de erro
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      errorDiv.textContent = 'Erro ao compartilhar. Tente novamente.';
      document.body.appendChild(errorDiv);
      
      setTimeout(() => {
        document.body.removeChild(errorDiv);
      }, 3000);
    }
  };

  useEffect(() => {
    if (user) {
      loadHistory();
      loadStats();
    }
  }, [user]);

  useEffect(() => {
    if (user && showFullHistory) {
      loadFullHistory();
    }
  }, [user, currentPage, searchTerm, filterResult, filterType, showFullHistory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4 relative">
            <button
              onClick={() => navigate('/dashboard')}
              className="absolute left-0 flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </button>
            <Shield className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Verdade ou Fake</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Detector de fake news com inteligência artificial. Verifique a veracidade de notícias, 
            textos e imagens com análise automatizada e fontes confiáveis.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Painel Principal */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                {/* Seletor de Tipo */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tipo de conteúdo:
                  </label>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setInputType('texto')}
                      className={`flex items-center px-4 py-2 rounded-lg border-2 transition-colors ${
                        inputType === 'texto'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      Texto
                    </button>
                    <button
                      onClick={() => setInputType('link')}
                      className={`flex items-center px-4 py-2 rounded-lg border-2 transition-colors ${
                        inputType === 'link'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <LinkIcon className="w-5 h-5 mr-2" />
                      Link
                    </button>
                    <button
                      onClick={() => setInputType('imagem')}
                      className={`flex items-center px-4 py-2 rounded-lg border-2 transition-colors ${
                        inputType === 'imagem'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <ImageIcon className="w-5 h-5 mr-2" />
                      Imagem
                    </button>
                  </div>
                </div>

                {/* Campo de Entrada */}
                <div className="mb-6">
                  {inputType === 'imagem' ? (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
                      >
                        {content ? (
                          <img src={content} alt="Preview" className="max-w-full h-48 mx-auto object-contain" />
                        ) : (
                          <div>
                            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">Clique para selecionar uma imagem</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={
                        inputType === 'link'
                          ? 'Cole aqui o link da notícia...'
                          : 'Cole aqui o texto da notícia...'
                      }
                      className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  )}
                </div>

                {/* Botão de Análise */}
                <button
                  onClick={analyzeContent}
                  disabled={isAnalyzing || !content.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Verificar
                    </>
                  )}
                </button>

                {/* Erro */}
                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                {/* Resultado */}
                {result && (
                  <div className={`mt-8 p-6 rounded-xl border-2 ${getResultColor(result.resultado)}`}>
                    <div className="flex items-center mb-4">
                      {getResultIcon(result.resultado)}
                      <div className="ml-4">
                        <h3 className="text-2xl font-bold">{getResultLabel(result.resultado)}</h3>
                        <p className="text-sm opacity-75">Confiança: {result.confianca}%</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Explicação:</h4>
                      <p className="leading-relaxed">{result.explicacao}</p>
                    </div>

                    {result.fontes && result.fontes.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">Fontes consultadas:</h4>
                        <ul className="space-y-1">
                          {result.fontes.map((fonte, index) => (
                            <li key={index} className="flex items-center">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              <span className="text-sm">{fonte}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Feedback */}
                    <div className="pt-4 border-t border-current border-opacity-20">
                      {!feedbackGiven ? (
                        <div className="flex items-center space-x-4 mb-3">
                          <span className="text-sm font-medium">Esta análise foi útil?</span>
                          <button
                            onClick={() => giveFeedback('concordo')}
                            className="flex items-center px-3 py-1 rounded-full bg-white bg-opacity-50 hover:bg-opacity-75 transition-colors"
                          >
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            Sim
                          </button>
                          <button
                            onClick={() => giveFeedback('discordo')}
                            className="flex items-center px-3 py-1 rounded-full bg-white bg-opacity-50 hover:bg-opacity-75 transition-colors"
                          >
                            <ThumbsDown className="w-4 h-4 mr-1" />
                            Não
                          </button>
                        </div>
                      ) : (
                        <div className="mb-3">
                          <span className="text-sm font-medium text-green-600">✓ Feedback enviado com sucesso!</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={shareAnalysis}
                          className="flex items-center px-3 py-1 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors text-sm"
                        >
                          <Share2 className="w-4 h-4 mr-1" />
                          Compartilhar
                        </button>
                        
                        <button
                          onClick={reportContent}
                          className="flex items-center px-3 py-1 rounded-full bg-red-100 hover:bg-red-200 text-red-700 transition-colors text-sm"
                        >
                          <Flag className="w-4 h-4 mr-1" />
                          Denunciar conteúdo
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Painel Lateral */}
            <div className="space-y-6">
              {/* Estatísticas */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  Estatísticas
                </h3>
                {loadingStats ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader className="w-5 h-5 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total de verificações:</span>
                      <span className="font-semibold">{stats.total_verificacoes.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Esta semana:</span>
                      <span className="font-semibold">{stats.verificacoes_semana.toLocaleString()}</span>
                    </div>
                    {stats.total_verificacoes > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Conteúdo verdadeiro:</span>
                          <span className="font-semibold text-green-600">
                            {Math.round(((stats.por_resultado?.verdade || 0) / stats.total_verificacoes) * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Fake news detectadas:</span>
                          <span className="font-semibold text-red-600">
                            {Math.round(((stats.por_resultado?.fake || 0) / stats.total_verificacoes) * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Tendencioso:</span>
                          <span className="font-semibold text-yellow-600">
                            {Math.round(((stats.por_resultado?.tendencioso || 0) / stats.total_verificacoes) * 100)}%
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Histórico */}
              {user && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <History className="w-5 h-5 mr-2 text-blue-600" />
                      Suas Verificações
                    </h3>
                    <button
                      onClick={() => {
                        setShowFullHistory(!showFullHistory);
                        if (!showFullHistory) {
                          loadFullHistory();
                        }
                      }}
                      className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {showFullHistory ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-1" />
                          Ocultar
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-1" />
                          Ver todas
                        </>
                      )}
                    </button>
                  </div>
                  
                  {!showFullHistory && history.length > 0 && (
                    <div className="space-y-3">
                      {history.slice(0, 3).map((item) => (
                        <div key={item.id} className="border-l-4 border-gray-200 pl-3">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              item.resultado === 'verdade' ? 'bg-green-100 text-green-800' :
                              item.resultado === 'fake' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {getResultLabel(item.resultado)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 truncate">
                            {item.tipo_input === 'imagem' ? 'Imagem enviada' : `${item.conteudo.substring(0, 50)}...`}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {!showFullHistory && history.length === 0 && (
                     <p className="text-gray-500 text-center py-4">Nenhuma verificação encontrada</p>
                   )}
                   
                   {/* Histórico Completo */}
                   {showFullHistory && (
                     <div className="mt-6 space-y-4">
                       {/* Filtros e Busca */}
                       <div className="bg-gray-50 rounded-lg p-4">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                           {/* Busca */}
                           <div className="relative">
                             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                             <input
                               type="text"
                               placeholder="Buscar no conteúdo..."
                               value={searchTerm}
                               onChange={(e) => setSearchTerm(e.target.value)}
                               className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                             />
                           </div>

                           {/* Filtro por Resultado */}
                           <select
                             value={filterResult}
                             onChange={(e) => setFilterResult(e.target.value)}
                             className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           >
                             <option value="">Todos os resultados</option>
                             <option value="verdade">Verdadeiro</option>
                             <option value="tendencioso">Tendencioso</option>
                             <option value="fake">Fake News</option>
                           </select>

                           {/* Filtro por Tipo */}
                           <select
                             value={filterType}
                             onChange={(e) => setFilterType(e.target.value)}
                             className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           >
                             <option value="">Todos os tipos</option>
                             <option value="texto">Texto</option>
                             <option value="link">Link</option>
                             <option value="imagem">Imagem</option>
                           </select>
                         </div>
                       </div>

                       {/* Lista de Verificações */}
                       {loadingFullHistory ? (
                         <div className="flex items-center justify-center py-8">
                           <Loader className="w-6 h-6 animate-spin text-blue-600" />
                         </div>
                       ) : fullHistory.length > 0 ? (
                         <div className="space-y-3">
                           {fullHistory.map((verificacao) => (
                             <div key={verificacao.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                               <div className="flex items-start justify-between">
                                 <div className="flex-1">
                                   <div className="flex items-center space-x-2 mb-2">
                                     <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                       verificacao.resultado === 'verdade' ? 'bg-green-100 text-green-800' :
                                       verificacao.resultado === 'fake' ? 'bg-red-100 text-red-800' :
                                       'bg-yellow-100 text-yellow-800'
                                     }`}>
                                       {verificacao.resultado === 'verdade' ? '✅ VERDADE' :
                                        verificacao.resultado === 'fake' ? '❌ FAKE NEWS' :
                                        '⚠️ TENDENCIOSO'}
                                     </span>
                                     <span className="text-xs text-gray-500">
                                       {verificacao.tipo_input.toUpperCase()}
                                     </span>
                                     <span className="text-xs text-gray-500">
                                       {verificacao.confianca}% confiança
                                     </span>
                                   </div>
                                   <p className="text-sm text-gray-900 mb-2">
                                     {verificacao.tipo_input === 'imagem' ? 'Imagem enviada para análise' : truncateText(verificacao.conteudo, 150)}
                                   </p>
                                   <p className="text-xs text-gray-500">
                                     {formatDate(verificacao.created_at)}
                                   </p>
                                 </div>
                                 <div className="flex items-center space-x-2 ml-4">
                                   <button
                                     onClick={() => setSelectedVerificacao(verificacao)}
                                     className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                     title="Ver detalhes"
                                   >
                                     <Eye className="w-4 h-4" />
                                   </button>
                                   <button
                                     onClick={() => deleteVerificacao(verificacao.id)}
                                     className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                     title="Excluir"
                                   >
                                     <Trash2 className="w-4 h-4" />
                                   </button>
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                       ) : (
                         <div className="text-center py-8">
                           <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                           <p className="text-gray-500">Nenhuma verificação encontrada</p>
                         </div>
                       )}

                       {/* Paginação */}
                       {totalPages > 1 && (
                         <div className="flex items-center justify-between pt-4">
                           <div className="text-sm text-gray-700">
                             Página {currentPage} de {totalPages}
                           </div>
                           <div className="flex items-center space-x-2">
                             <button
                               onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                               disabled={currentPage === 1}
                               className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                               <ChevronLeft className="w-4 h-4" />
                             </button>
                             <button
                               onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                               disabled={currentPage === totalPages}
                               className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                               <ChevronRight className="w-4 h-4" />
                             </button>
                           </div>
                         </div>
                       )}
                     </div>
                   )}
                 </div>
               )}

              {/* Como Funciona */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Como Funciona</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                      1
                    </div>
                    <p>Cole o texto, link ou envie uma imagem</p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                      2
                    </div>
                    <p>Nossa IA analisa o conteúdo usando múltiplas fontes</p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                      3
                    </div>
                    <p>Receba o veredito com explicação detalhada</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Detalhes da Verificação */}
        {selectedVerificacao && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Detalhes da Verificação</h3>
                  <button
                    onClick={() => setSelectedVerificacao(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Status e Informações */}
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedVerificacao.resultado === 'verdade' ? 'bg-green-100 text-green-800' :
                      selectedVerificacao.resultado === 'fake' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedVerificacao.resultado === 'verdade' ? '✅ VERDADE' :
                       selectedVerificacao.resultado === 'fake' ? '❌ FAKE NEWS' :
                       '⚠️ TENDENCIOSO'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {selectedVerificacao.tipo_input.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {selectedVerificacao.confianca}% confiança
                    </span>
                  </div>

                  {/* Conteúdo */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Conteúdo Analisado:</h4>
                    <div className="bg-gray-50 rounded-lg p-3">
                      {selectedVerificacao.tipo_input === 'imagem' ? (
                        <p className="text-sm text-gray-600">Imagem enviada para análise</p>
                      ) : (
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedVerificacao.conteudo}</p>
                      )}
                    </div>
                  </div>

                  {/* Explicação */}
                  {selectedVerificacao.explicacao && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Explicação:</h4>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedVerificacao.explicacao}</p>
                      </div>
                    </div>
                  )}

                  {/* Fontes */}
                  {selectedVerificacao.fontes && selectedVerificacao.fontes.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Fontes:</h4>
                      <div className="space-y-2">
                        {selectedVerificacao.fontes.map((fonte, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <a
                              href={fonte.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              {fonte.titulo}
                            </a>
                            {fonte.descricao && (
                              <p className="text-xs text-gray-600 mt-1">{fonte.descricao}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Data */}
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      Verificado em: {formatDate(selectedVerificacao.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal de Limite Atingido */}
      <LimitReached
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        limitType="fake_news"
        currentPlan={userPlan}
        limitsInfo={limitInfo}
      />
    </div>
  );
};

export default VerdadeOuFake;