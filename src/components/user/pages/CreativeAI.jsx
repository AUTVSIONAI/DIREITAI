import React, { useState, useEffect } from 'react'
import { Sparkles, Image, Video, MessageSquare, Quote, Download, Copy, Share2, Wand2, RefreshCw, Save, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../../lib/api'

const CreativeAI = () => {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [selectedTemplate, setSelectedTemplate] = useState('social_post')
  const [prompt, setPrompt] = useState('')
  const [generatedContent, setGeneratedContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [selectedTone, setSelectedTone] = useState('profissional')
  const [selectedLength, setSelectedLength] = useState('medio')
  const [usageStats, setUsageStats] = useState({ today: 0, limit: 2, remaining: 2, plan: 'gratuito' })
  const [limitError, setLimitError] = useState('')

  // Carregar estatísticas de uso ao montar o componente
  useEffect(() => {
    const loadUsageStats = async () => {
      try {
        const response = await apiClient.get('/ai/creative-ai/usage')
        setUsageStats(response.data.usage)
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
      }
    }

    if (userProfile) {
      loadUsageStats()
    }
  }, [userProfile])

  const templates = [
    {
      id: 'social_post',
      name: 'Post Social',
      icon: MessageSquare,
      description: 'Crie posts envolventes para redes sociais',
      color: 'blue',
      placeholder: 'Ex: Escreva um post sobre a importância da família na sociedade'
    },
    {
      id: 'meme',
      name: 'Meme/Imagem',
      icon: Image,
      description: 'Gere ideias e textos para memes conservadores',
      color: 'green',
      placeholder: 'Ex: Crie um meme sobre responsabilidade fiscal'
    },
    {
      id: 'video_script',
      name: 'Roteiro Vídeo',
      icon: Video,
      description: 'Roteiros para vídeos educativos e informativos',
      color: 'purple',
      placeholder: 'Ex: Roteiro de 2 minutos sobre empreendedorismo'
    },
    {
      id: 'speech',
      name: 'Discurso',
      icon: Quote,
      description: 'Discursos inspiradores e motivacionais',
      color: 'red',
      placeholder: 'Ex: Discurso de 5 minutos sobre patriotismo'
    }
  ]

  const tones = [
    { id: 'profissional', name: 'Profissional', description: 'Tom formal e respeitoso' },
    { id: 'inspirador', name: 'Inspirador', description: 'Tom motivacional e positivo' },
    { id: 'educativo', name: 'Educativo', description: 'Tom didático e informativo' },
    { id: 'combativo', name: 'Combativo', description: 'Tom firme e determinado' },
    { id: 'familiar', name: 'Familiar', description: 'Tom caloroso e próximo' }
  ]

  const lengths = [
    { id: 'curto', name: 'Curto', description: '1-2 parágrafos' },
    { id: 'medio', name: 'Médio', description: '3-4 parágrafos' },
    { id: 'longo', name: 'Longo', description: '5+ parágrafos' }
  ]

  const mockHistory = [
    {
      id: 1,
      template: 'social_post',
      prompt: 'Post sobre importância da família',
      content: 'A família é o alicerce da nossa sociedade. É no seio familiar que aprendemos os valores fundamentais que nos guiarão por toda a vida: respeito, responsabilidade, amor e união. Quando fortalecemos nossas famílias, fortalecemos nossa nação. #FamíliaForte #ValoresConservadores',
      createdAt: '2024-01-15T10:30:00Z',
      tone: 'inspirador',
      length: 'curto'
    },
    {
      id: 2,
      template: 'speech',
      prompt: 'Discurso sobre empreendedorismo',
      content: 'Meus caros patriotas, o empreendedorismo é a força motriz que impulsiona nossa economia e nossa sociedade. Quando um brasileiro decide abrir seu próprio negócio, ele não está apenas buscando prosperidade pessoal, mas contribuindo para o crescimento de toda a nação...',
      createdAt: '2024-01-14T15:45:00Z',
      tone: 'profissional',
      length: 'longo'
    }
  ]

  const getTemplateColor = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600 border-blue-200',
      green: 'bg-green-100 text-green-600 border-green-200',
      purple: 'bg-purple-100 text-purple-600 border-purple-200',
      red: 'bg-red-100 text-red-600 border-red-200'
    }
    return colors[color] || colors.blue
  }

  const generateContent = async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    
    try {
      const response = await apiClient.post('/ai/creative-ai/generate', {
        prompt,
        template: selectedTemplate,
        tone: selectedTone,
        length: selectedLength
      })

      const data = response.data
      setGeneratedContent(data.content)
      setUsageStats(data.usage)
      setLimitError('')
        
      // Adicionar ao histórico
      const newItem = {
        id: Date.now(),
        template: selectedTemplate,
        prompt,
        content: data.content,
        createdAt: new Date().toISOString(),
        tone: selectedTone,
        length: selectedLength
      }
      setHistory(prev => [newItem, ...prev])
    } catch (error) {
      console.error('Erro ao gerar conteúdo:', error)
      
      // Verificar se é erro de limite
      if (error.response?.status === 429) {
        const errorData = error.response.data
        setLimitError(errorData.message || 'Limite diário atingido')
        setUsageStats({
          today: errorData.usage || 0,
          limit: errorData.limit || 2,
          remaining: 0,
          plan: errorData.plan || 'gratuito'
        })
        return
      }
      
      // Fallback para conteúdo simulado se a API falhar
        const template = templates.find(t => t.id === selectedTemplate)
        let mockContent = ''
        
        switch (selectedTemplate) {
          case 'social_post':
            mockContent = `🇧🇷 ${prompt}\n\nNossos valores conservadores são a base de uma sociedade próspera e justa. É fundamental que defendamos nossos princípios com coragem e determinação.\n\n#ValoresConservadores #BrasilForte #Patriotismo`
            break
          case 'meme':
            mockContent = `💡 IDEIA PARA MEME:\n\nTítulo: "${prompt}"\n\nTexto sugerido: "Quando você entende que responsabilidade fiscal significa um futuro melhor para seus filhos"\n\nImagem sugerida: Pessoa sorrindo olhando para uma planilha de gastos\n\n#ResponsabilidadeFiscal #FuturoMelhor`
            break
          case 'video_script':
            mockContent = `🎬 ROTEIRO DE VÍDEO\n\n[ABERTURA - 0:00-0:15]\nOlá, patriotas! Hoje vamos falar sobre ${prompt.toLowerCase()}.\n\n[DESENVOLVIMENTO - 0:15-1:30]\nO empreendedorismo é fundamental para o crescimento do nosso país...\n\n[CONCLUSÃO - 1:30-2:00]\nLembrem-se: cada negócio criado é um passo rumo à prosperidade nacional!`
            break
          case 'speech':
            mockContent = `🎤 DISCURSO: ${prompt}\n\nCaros compatriotas,\n\nReunimo-nos hoje para celebrar e reafirmar nosso amor pela pátria. O patriotismo não é apenas um sentimento, é um compromisso diário com a excelência, com a justiça e com o progresso de nossa nação.\n\nQuando olhamos para nossa bandeira, vemos mais que cores e símbolos. Vemos a história de um povo corajoso, trabalhador e determinado...\n\nViva o Brasil! 🇧🇷`
            break
          default:
            mockContent = 'Conteúdo gerado com base no seu prompt.'
        }
        
        setGeneratedContent(mockContent)
        
        // Adicionar ao histórico
        const newItem = {
          id: Date.now(),
          template: selectedTemplate,
          prompt,
          content: mockContent,
          createdAt: new Date().toISOString(),
          tone: selectedTone,
          length: selectedLength
        }        
        setHistory(prev => [newItem, ...prev])
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Conteúdo copiado para a área de transferência!')
  }

  const saveContent = (content) => {
    // Implementar salvamento
    alert('Conteúdo salvo com sucesso!')
  }

  const shareContent = (content) => {
    if (navigator.share) {
      navigator.share({
        title: 'Conteúdo Direitai.com',
        text: content
      })
    } else {
      copyToClipboard(content)
    }
  }

  const regenerateContent = () => {
    if (generatedContent) {
      generateContent()
    }
  }

  const currentTemplate = templates.find(t => t.id === selectedTemplate)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">IA Criativa</h2>
          <p className="text-gray-600">Crie conteúdo conservador de qualidade com inteligência artificial</p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="btn-secondary"
        >
          {showHistory ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
          {showHistory ? 'Ocultar' : 'Ver'} Histórico
        </button>
      </div>

      {/* Usage Stats */}
      <div className={`card ${limitError ? 'bg-red-50 border-red-200' : (usageStats?.plan === 'gratuito') ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
        <div className="flex items-center space-x-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
            limitError ? 'bg-red-100' : (usageStats?.plan === 'gratuito') ? 'bg-blue-100' : 'bg-green-100'
          }`}>
            <Sparkles className={`h-5 w-5 ${
              limitError ? 'text-red-600' : (usageStats?.plan === 'gratuito') ? 'text-blue-600' : 'text-green-600'
            }`} />
          </div>
          <div className="flex-1">
            <h3 className={`font-medium ${
              limitError ? 'text-red-900' : (usageStats?.plan === 'gratuito') ? 'text-blue-900' : 'text-green-900'
            }`}>
              {limitError ? 'Limite Atingido' : 
                (usageStats?.plan === 'gratuito') ? 'Plano Patriota Gratuito' :
                (usageStats?.plan === 'engajado') ? 'Plano Patriota Engajado' :
                (usageStats?.plan === 'premium') ? 'Plano Patriota Premium' :
                (usageStats?.plan === 'lider') ? 'Plano Patriota Líder' : 'Seu Plano'}
            </h3>
            <p className={`text-sm ${
              limitError ? 'text-red-800' : (usageStats?.plan === 'gratuito') ? 'text-blue-800' : 'text-green-800'
            }`}>
              {limitError ? limitError :
               (usageStats?.limits?.generations === -1) ? 'Gerações ilimitadas' :
               `Você usou ${usageStats?.today?.generations || 0} de ${usageStats?.limits?.generations || 0} gerações hoje (${usageStats?.remaining || 0} restantes)`}
            </p>
          </div>
          {(limitError || ((usageStats?.plan === 'gratuito') && (usageStats?.remaining === 0))) && (
            <button
              onClick={() => navigate('/plan')}
              className="btn-primary"
            >
              Fazer Upgrade
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Configuration */}
        <div className="lg:col-span-1 space-y-6">
          {/* Template Selection */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Conteúdo</h3>
            <div className="space-y-3">
              {templates.map(template => {
                const Icon = template.icon
                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      selectedTemplate === template.id
                        ? getTemplateColor(template.color)
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5" />
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm opacity-75">{template.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tone Selection */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tom</h3>
            <select
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {tones.map(tone => (
                <option key={tone.id} value={tone.id}>
                  {tone.name} - {tone.description}
                </option>
              ))}
            </select>
          </div>

          {/* Length Selection */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tamanho</h3>
            <div className="space-y-2">
              {lengths.map(length => (
                <label key={length.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="length"
                    value={length.id}
                    checked={selectedLength === length.id}
                    onChange={(e) => setSelectedLength(e.target.value)}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">{length.name}</span>
                    <span className="text-sm text-gray-600 ml-2">{length.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Content Generation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Input */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Descreva o que você quer criar
            </h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={currentTemplate?.placeholder}
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-500">
                {prompt.length}/500 caracteres
              </span>
              <div className="flex space-x-2">
                {generatedContent && (
                  <button
                    onClick={regenerateContent}
                    disabled={isGenerating}
                    className="btn-secondary"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                    Regenerar
                  </button>
                )}
                <button
                  onClick={generateContent}
                  disabled={!prompt.trim() || isGenerating || ((usageStats?.remaining === 0) && (usageStats?.limits?.generations !== -1))}
                  className="btn-primary"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Gerar Conteúdo
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Generated Content */}
          {generatedContent && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Conteúdo Gerado</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyToClipboard(generatedContent)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                    title="Copiar"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => saveContent(generatedContent)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                    title="Salvar"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => shareContent(generatedContent)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                    title="Compartilhar"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {}}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-gray-900 font-sans">
                  {generatedContent}
                </pre>
              </div>
            </div>
          )}

          {/* History */}
          {showHistory && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Criações</h3>
              {mockHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhuma criação no histórico ainda.
                </p>
              ) : (
                <div className="space-y-4">
                  {mockHistory.map(item => {
                    const template = templates.find(t => t.id === item.template)
                    const Icon = template?.icon || MessageSquare
                    
                    return (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4 text-gray-600" />
                            <span className="font-medium text-gray-900">{template?.name}</span>
                            <span className="text-sm text-gray-500">
                              {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => copyToClipboard(item.content)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => shareContent(item.content)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <Share2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Prompt:</strong> {item.prompt}
                        </p>
                        <div className="bg-gray-50 rounded p-3">
                          <p className="text-sm text-gray-900 line-clamp-3">
                            {item.content}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
            <Sparkles className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900 mb-1">Dicas para Melhores Resultados</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Seja específico no seu prompt - quanto mais detalhes, melhor o resultado</li>
              <li>• Experimente diferentes tons para encontrar o que melhor se adequa ao seu público</li>
              <li>• Use o botão "Regenerar" se não ficar satisfeito com o primeiro resultado</li>
              <li>• Combine diferentes tipos de conteúdo para uma estratégia completa</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreativeAI