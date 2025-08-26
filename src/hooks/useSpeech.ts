import { useState, useEffect, useCallback } from 'react';

// Função para detectar dispositivos móveis
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));
};

// Interface para configurações de voz
interface SpeechConfig {
  voice?: SpeechSynthesisVoice;
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

// Interface para reconhecimento de voz
interface SpeechRecognitionConfig {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
}

// Hook para síntese de voz (Text-to-Speech)
export const useSpeechSynthesis = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [isMobile] = useState(isMobileDevice());

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
      
      const updateVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        console.log('🎤 Vozes disponíveis:', availableVoices.map(v => `${v.name} (${v.lang})`));
        
        // Filtrar e priorizar vozes brasileiras
        const brazilianVoices = availableVoices.filter(voice => {
          const lang = voice.lang.toLowerCase();
          const name = voice.name.toLowerCase();
          return (
            lang.includes('pt-br') || 
            (lang.includes('pt') && (name.includes('brasil') || name.includes('brazil')))
          );
        });
        
        console.log('🇧🇷 Vozes brasileiras encontradas:', brazilianVoices.map(v => `${v.name} (${v.lang})`));
        setVoices(availableVoices);
      };

      // Aguardar um pouco para carregar as vozes em mobile
      if (isMobile) {
        setTimeout(updateVoices, 500);
      } else {
        updateVoices();
      }
      
      window.speechSynthesis.onvoiceschanged = updateVoices;

      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, [isMobile]);

  const speak = useCallback((text: string, config: SpeechConfig = {}) => {
    if (!supported || !text.trim()) return;

    // Parar qualquer fala em andamento
    window.speechSynthesis.cancel();

    // Configurações otimizadas para mobile
    const mobileOptimizedText = isMobile ? 
      text.substring(0, 300) : // Aumentar limite para mobile
      text;

    const utterance = new SpeechSynthesisUtterance(mobileOptimizedText);
    
    // Configurar voz (priorizar português brasileiro nativo)
    if (config.voice) {
      utterance.voice = config.voice;
    } else {
      // Buscar vozes brasileiras com prioridade
      const brazilianVoices = voices.filter(voice => {
        const lang = voice.lang.toLowerCase();
        const name = voice.name.toLowerCase();
        return (
          lang.includes('pt-br') || 
          (lang.includes('pt') && (name.includes('brasil') || name.includes('brazil') || name.includes('luciana') || name.includes('felipe')))
        );
      });
      
      // Priorizar vozes femininas brasileiras para melhor experiência
      const femaleVoice = brazilianVoices.find(voice => 
        voice.name.toLowerCase().includes('luciana') || 
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('feminina')
      );
      
      const selectedVoice = femaleVoice || brazilianVoices[0] || voices.find(voice => voice.lang.includes('pt'));
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('🎤 Voz selecionada:', selectedVoice.name, '- Idioma:', selectedVoice.lang);
      }
    }

    // Configurações otimizadas para mobile brasileiro
    utterance.rate = config.rate || (isMobile ? 0.85 : 0.9); // Velocidade otimizada para português
    utterance.pitch = config.pitch || (isMobile ? 1.1 : 1); // Tom ligeiramente mais alto para mobile
    utterance.volume = config.volume || (isMobile ? 0.9 : 1); // Volume otimizado
    utterance.lang = config.lang || 'pt-BR';

    utterance.onstart = () => {
      setSpeaking(true);
      console.log('🎤 Iniciando síntese de voz em português brasileiro');
    };
    utterance.onend = () => {
      setSpeaking(false);
      console.log('🎤 Síntese de voz finalizada');
    };
    utterance.onerror = (event) => {
      console.warn('🚫 Erro na síntese de voz:', event);
      setSpeaking(false);
    };

    // Para dispositivos móveis, aguardar um pouco mais antes de falar
    if (isMobile) {
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 150);
    } else {
      window.speechSynthesis.speak(utterance);
    }
  }, [supported, voices, isMobile]);

  const stop = useCallback(() => {
    if (supported) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, [supported]);

  const pause = useCallback(() => {
    if (supported) {
      window.speechSynthesis.pause();
    }
  }, [supported]);

  const resume = useCallback(() => {
    if (supported) {
      window.speechSynthesis.resume();
    }
  }, [supported]);

  return {
    speak,
    stop,
    pause,
    resume,
    speaking,
    supported,
    voices
  };
};

// Hook para reconhecimento de voz (Speech-to-Text)
export const useSpeechRecognition = () => {
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isMobile] = useState(isMobileDevice());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setSupported(true);
        const recognitionInstance = new SpeechRecognition();
        
        // Configurações otimizadas para mobile brasileiro
        recognitionInstance.continuous = !isMobile; // Desabilitar continuous em mobile
        recognitionInstance.interimResults = !isMobile; // Desabilitar interim results em mobile
        recognitionInstance.lang = 'pt-BR';
        recognitionInstance.maxAlternatives = 1;
        
        // Configurações específicas para português brasileiro
        if (isMobile) {
          console.log('🎤 Configurando reconhecimento de voz para mobile brasileiro');
        }
        
        setRecognition(recognitionInstance);
      }
    }
  }, [isMobile]);

  const startListening = useCallback((config: SpeechRecognitionConfig = {}) => {
    if (!supported || !recognition) return;

    recognition.continuous = config.continuous || false;
    recognition.interimResults = config.interimResults || true;
    recognition.lang = config.lang || 'pt-BR';

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        }
      }
      
      if (finalTranscript) {
        setTranscript(finalTranscript);
      }
    };

    // Para dispositivos móveis brasileiros, aguardar um pouco antes de iniciar
    if (isMobile) {
      console.log('🎤 Iniciando reconhecimento de voz em português brasileiro (mobile)');
      setTimeout(() => {
        recognition.start();
      }, 300);
    } else {
      console.log('🎤 Iniciando reconhecimento de voz em português brasileiro (desktop)');
      recognition.start();
    }
  }, [supported, recognition, isMobile]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
    }
  }, [recognition]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    transcript,
    listening,
    supported,
    startListening,
    stopListening,
    resetTranscript
  };
};

// Hook combinado para funcionalidades completas de voz
export const useSpeech = () => {
  const speechSynthesis = useSpeechSynthesis();
  const speechRecognition = useSpeechRecognition();

  return {
    ...speechSynthesis,
    ...speechRecognition,
    speechSupported: speechSynthesis.supported,
    recognitionSupported: speechRecognition.supported
  };
};