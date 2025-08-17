import React, { useState, useRef } from 'react';
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
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { apiRequest } from '../utils/apiClient';

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
  const [error, setError] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setContent(e.target?.result as string);
        };
        reader.readAsDataURL(file);
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao analisar conteúdo');
      }

      setResult(data);
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

      const data = await response.json();
      if (response.ok) {
        setHistory(data.checks || []);
      }
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
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
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          tipo: tipo === 'concordo' ? 'positivo' : 'negativo',
          comentario: ''
        })
      });

      if (response.ok) {
        setFeedbackGiven(true);
        const successMessage = tipo === 'concordo' 
          ? 'Obrigado pelo feedback positivo!' 
          : 'Obrigado pelo feedback. Vamos melhorar nossa análise.';
        console.log(successMessage);
      }
    } catch (err) {
      console.error('Erro ao enviar feedback:', err);
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
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          tipo: 'denuncia',
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

  React.useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

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
                      
                      <button
                        onClick={reportContent}
                        className="flex items-center px-3 py-1 rounded-full bg-red-100 hover:bg-red-200 text-red-700 transition-colors text-sm"
                      >
                        <Flag className="w-4 h-4 mr-1" />
                        Denunciar conteúdo
                      </button>
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
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Verificações hoje:</span>
                    <span className="font-semibold">1,247</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Fake news detectadas:</span>
                    <span className="font-semibold text-red-600">23%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Conteúdo verdadeiro:</span>
                    <span className="font-semibold text-green-600">61%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tendencioso:</span>
                    <span className="font-semibold text-yellow-600">16%</span>
                  </div>
                </div>
              </div>

              {/* Histórico */}
              {user && history.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <History className="w-5 h-5 mr-2 text-blue-600" />
                    Suas Verificações
                  </h3>
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
      </div>
    </div>
  );
};

export default VerdadeOuFake;