import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Settings, Smartphone } from 'lucide-react';
import { useSpeech } from '../../hooks/useSpeech';

// Função para detectar dispositivos móveis
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));
};

const VoiceControls = forwardRef(({ 
  onTranscript, 
  autoSpeak = true, 
  lastMessage = '',
  className = '',
  voiceId = null, // Novo prop para ID de voz específico (MiniMax/Clonada)
  voiceProvider: propVoiceProvider = null // Novo prop para forçar provider
}, ref) => {
  const {
    speakWithVoice,
    stop: stopSpeaking,
    speaking,
    speechSupported,
    transcript,
    listening,
    recognitionSupported,
    startListening,
    stopListening,
    resetTranscript,
    getBrazilianVoices
  } = useSpeech();

  const [isMobile] = useState(isMobileDevice());
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false); // Agora vamos usar isso
  const [speechRate, setSpeechRate] = useState(isMobile ? 0.8 : 0.9);
  const [speechVolume, setSpeechVolume] = useState(isMobile ? 0.8 : 1);
  // Se voiceId for passado, o provider default deve ser 'minimax' (ou o que o sistema usar para cloned voices)
  const [voiceProvider, setVoiceProvider] = useState(propVoiceProvider || (voiceId ? 'minimax' : 'native')); 
  const [localVoices, setLocalVoices] = useState([]);
  const [selectedVoiceType, setSelectedVoiceType] = useState('female');
  const [availableVoices, setAvailableVoices] = useState({ female: null, male: null });

  // Atualizar provider se props mudarem
  useEffect(() => {
    if (voiceId) {
      setVoiceProvider('minimax');
    } else if (propVoiceProvider) {
      setVoiceProvider(propVoiceProvider);
    }
  }, [voiceId, propVoiceProvider]);

  // Buscar vozes locais
  useEffect(() => {
    if (voiceProvider === 'local') {
      const voiceServiceUrl = import.meta.env.VITE_VOICE_SERVICE_URL || '/api/voice';
      fetch(`${voiceServiceUrl}/voices`)
        .then(res => res.json())
        .then(data => {
          setLocalVoices(data);
          if (data.length > 0 && !data.find(v => v.id === selectedVoiceType)) {
            setSelectedVoiceType(data[0].id);
          }
        })
        .catch(err => console.error('Erro ao buscar vozes locais:', err));
    }
  }, [voiceProvider]);

  // Expor métodos para o componente pai
  useImperativeHandle(ref, () => ({
    speakMessage: (text) => {
      if (voiceEnabled && speechSupported && text) {
        const cleanText = text
          .replace(/\*\*(.*?)\*\*/g, '$1') // negrito
          .replace(/\*(.*?)\*/g, '$1') // itálico
          .replace(/`(.*?)`/g, '$1') // código inline
          .replace(/```[\s\S]*?```/g, '[código]') // blocos de código
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
          .replace(/#{1,6}\s/g, '') // headers
          .replace(/\n+/g, '. ') // quebras de linha
          .trim();
        
        const voiceServiceUrl = import.meta.env.VITE_VOICE_SERVICE_URL || 'http://localhost:8005';
        if (cleanText) {
          console.log('🎤 Falando mensagem via VoiceControls:', cleanText.substring(0, 50) + '...');
          
          // Determine the correct voice ID to use
          // If provider is minimax/cloned, use the specific voiceId prop if available
          // Otherwise fall back to selectedVoiceType (female/male)
          const actualVoiceId = (voiceProvider === 'minimax' && voiceId) ? voiceId : selectedVoiceType;

          speakWithVoice(cleanText, actualVoiceId, {
            rate: speechRate,
            volume: speechVolume,
            provider: voiceProvider,
            apiUrl: voiceServiceUrl
          });
        }
      }
    },
    stopSpeaking: () => {
      if (speaking) {
        stopSpeaking();
      }
    }
  }), [voiceEnabled, speechSupported, speakWithVoice, selectedVoiceType, speechRate, speechVolume, speaking, stopSpeaking, voiceProvider]);

  // Configurar vozes brasileiras disponíveis
  useEffect(() => {
    const voices = getBrazilianVoices();
    if (voices.female || voices.male) {
      setAvailableVoices(voices);
      console.log('🎤 Vozes brasileiras configuradas:', {
        feminina: voices.female?.name,
        masculina: voices.male?.name
      });
    }
  }, [getBrazilianVoices]);

  // Auto-falar quando receber nova mensagem da IA
  useEffect(() => {
    if (autoSpeak && voiceEnabled && lastMessage && speechSupported) {
      // Limpar markdown e formatação
      const cleanText = lastMessage
        .replace(/\*\*(.*?)\*\*/g, '$1') // negrito
        .replace(/\*(.*?)\*/g, '$1') // itálico
        .replace(/`(.*?)`/g, '$1') // código inline
        .replace(/```[\s\S]*?```/g, '[código]') // blocos de código
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
        .replace(/#{1,6}\s/g, '') // headers
        .replace(/\n+/g, '. ') // quebras de linha
        .trim();

      if (cleanText) {
        console.log('🎤 Auto-falando resposta da IA:', cleanText.substring(0, 50) + '...');
        
        // Mesma lógica de prioridade para auto-speak
        const targetVoice = voiceId || selectedVoiceType;
        const targetProvider = voiceId ? 'minimax' : voiceProvider;

        speakWithVoice(cleanText, targetVoice, {
          rate: speechRate,
          volume: speechVolume,
          provider: targetProvider
        });
      }
    }
  }, [lastMessage, autoSpeak, voiceEnabled, speechSupported, speakWithVoice, selectedVoiceType, speechRate, speechVolume, voiceId, voiceProvider]);

  // Processar transcrição
  useEffect(() => {
    if (transcript && onTranscript) {
      onTranscript(transcript);
      resetTranscript();
    }
  }, [transcript, onTranscript, resetTranscript]);

  const handleMicClick = () => {
    if (listening) {
      stopListening();
    } else {
      startListening({
        continuous: false,
        interimResults: true,
        lang: 'pt-BR'
      });
    }
  };

  const handleVolumeClick = () => {
    if (speaking) {
      stopSpeaking();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  if (!speechSupported && !recognitionSupported) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Controle de Microfone */}
      {recognitionSupported && (
        <button
          onClick={handleMicClick}
          disabled={speaking}
          className={`p-2 rounded-full transition-all duration-200 ${
            listening
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={listening ? 'Parar gravação' : 'Iniciar gravação de voz'}
        >
          {listening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </button>
      )}

      {/* Controle de Volume/Fala */}
      {speechSupported && (
        <button
          onClick={handleVolumeClick}
          className={`p-2 rounded-full transition-all duration-200 ${
            voiceEnabled
              ? speaking
                ? 'bg-gray-500 text-white animate-pulse'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-400'
          }`}
          title={voiceEnabled ? 'Desativar voz' : 'Ativar voz'}
        >
          {voiceEnabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </button>
      )}

      {/* Configurações de Voz */}
      {speechSupported && (
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            title="Configurações de voz"
          >
            <Settings className="h-4 w-4" />
          </button>

          {showSettings && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
              onClick={() => setShowSettings(false)}
            >
              <div 
                className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-72 max-w-[90vw]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    Configurações de Voz
                  </h3>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Fechar</span>
                    ×
                  </button>
                </div>
              
              {/* Provedor de Voz */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Provedor
                </label>
                <select
                  value={voiceProvider}
                  onChange={(e) => {
                      setVoiceProvider(e.target.value);
                      // Reset selection when changing provider
                      if (e.target.value === 'native') setSelectedVoiceType('female');
                      else if (e.target.value === 'local' && localVoices.length > 0) setSelectedVoiceType(localVoices[0].id);
                  }}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="native">Nativo (Browser)</option>
                  <option value="local">Local (XTTS v2)</option>
                  <option value="elevenlabs">ElevenLabs</option>
                  <option value="minimax">Voz Clonada (Oficial)</option>
                </select>
              </div>

              {/* Seleção de Voz */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Voz {voiceProvider === 'native' ? 'Brasileira' : (voiceProvider === 'local' ? 'Clonada' : 'ID')}
                </label>
                
                {voiceProvider === 'native' && (
                    <select
                      value={selectedVoiceType}
                      onChange={(e) => setSelectedVoiceType(e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      {availableVoices.female && (
                        <option value="female">
                          Feminina - {availableVoices.female.name}
                        </option>
                      )}
                      {availableVoices.male && (
                        <option value="male">
                          Masculina - {availableVoices.male.name}
                        </option>
                      )}
                    </select>
                )}

                {voiceProvider === 'local' && (
                    <select
                      value={selectedVoiceType}
                      onChange={(e) => setSelectedVoiceType(e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        {localVoices.length === 0 && <option value="">Nenhuma voz encontrada</option>}
                        {localVoices.map(voice => (
                            <option key={voice.id} value={voice.id}>
                                {voice.name} ({voice.source})
                            </option>
                        ))}
                    </select>
                )}

                {voiceProvider === 'minimax' && (
                    <div className="text-xs text-gray-500 italic p-1 bg-gray-50 border rounded">
                        {voiceId ? 'Usando voz clonada do agente' : 'ID da voz será usado automaticamente'}
                    </div>
                )}

                {voiceProvider === 'elevenlabs' && (
                    <input
                        type="text"
                        value={selectedVoiceType}
                        onChange={(e) => setSelectedVoiceType(e.target.value)}
                        placeholder="Voice ID do ElevenLabs"
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                )}
              </div>

              {/* Velocidade */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Velocidade: {speechRate.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Volume */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Volume: {Math.round(speechVolume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={speechVolume}
                  onChange={(e) => setSpeechVolume(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Teste */}
              <button
                onClick={() => speakWithVoice('Olá, patriota! Esta é a voz da DireitaIA.', selectedVoiceType, {
                  rate: speechRate,
                  volume: speechVolume
                })}
                className="w-full text-xs bg-gray-600 text-white py-1 px-2 rounded hover:bg-gray-700 transition-colors"
              >
                Testar Voz
              </button>
</div>
            </div>
          )}
        </div>
      )}

      {/* Indicador de Status */}
      {(listening || speaking || isMobile) && (
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          {listening && (
            <span className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></div>
              Ouvindo...
            </span>
          )}
          {speaking && (
            <span className="flex items-center">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse mr-1"></div>
              Falando...
            </span>
          )}
          {isMobile && (
            <span className="flex items-center text-green-600">
              <Smartphone className="w-3 h-3 mr-1" />
              Mobile
            </span>
          )}
        </div>
      )}
    </div>
  );
});

export default VoiceControls;