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
        setVoices(availableVoices);
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;

      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  const speak = useCallback((text: string, config: SpeechConfig = {}) => {
    if (!supported || !text.trim()) return;

    // Parar qualquer fala em andamento
    window.speechSynthesis.cancel();

    // Configurações otimizadas para mobile
    const mobileOptimizedText = isMobile ? 
      text.substring(0, 200) : // Limitar texto em dispositivos móveis
      text;

    const utterance = new SpeechSynthesisUtterance(mobileOptimizedText);
    
    // Configurar voz (preferir português brasileiro)
    if (config.voice) {
      utterance.voice = config.voice;
    } else {
      const ptBrVoice = voices.find(voice => 
        voice.lang.includes('pt-BR') || voice.lang.includes('pt')
      );
      if (ptBrVoice) {
        utterance.voice = ptBrVoice;
      }
    }

    // Configurações otimizadas para mobile
    utterance.rate = config.rate || (isMobile ? 0.8 : 0.9); // Mais lento em mobile
    utterance.pitch = config.pitch || 1;
    utterance.volume = config.volume || (isMobile ? 0.8 : 1); // Volume menor em mobile
    utterance.lang = config.lang || 'pt-BR';

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = (event) => {
      console.warn('Speech synthesis error:', event);
      setSpeaking(false);
    };

    // Para dispositivos móveis, aguardar um pouco antes de falar
    if (isMobile) {
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 100);
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
        
        // Configurações otimizadas para mobile
        recognitionInstance.continuous = !isMobile; // Desabilitar continuous em mobile
        recognitionInstance.interimResults = !isMobile; // Desabilitar interim results em mobile
        recognitionInstance.lang = 'pt-BR';
        recognitionInstance.maxAlternatives = 1;
        
        // Configurações específicas para mobile
        // Nota: grammars não precisa ser definido explicitamente
        
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

    // Para dispositivos móveis, aguardar um pouco antes de iniciar
    if (isMobile) {
      setTimeout(() => {
        recognition.start();
      }, 200);
    } else {
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