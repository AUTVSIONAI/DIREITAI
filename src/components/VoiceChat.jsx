import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Volume2, Loader2 } from 'lucide-react';
import { openai } from '../lib/openai'; // Supondo que você tenha configurado

const VoiceChat = ({ politicianName, politicianVoiceRefUrl, onUserMessage }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  
  const recognitionRef = useRef(null);
  const audioRef = useRef(new Audio());

  // Inicializar Web Speech API
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        handleUserVoiceInput(text);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Erro no reconhecimento de fala:', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    } else {
      console.warn('Navegador não suporta Web Speech API');
    }
  }, []);

  const startRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        setTranscript('');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleUserVoiceInput = async (userText) => {
    setIsProcessing(true);
    
    // 1. Notificar componente pai (para mostrar no chat visual se quiser)
    if (onUserMessage) onUserMessage(userText);

    try {
      // 2. Obter resposta da IA (DireitaGPT)
      // Aqui estou chamando OpenAI direto, mas o ideal é passar pelo seu backend para proteger a Key
      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: `Você é ${politicianName}. Responda de forma curta e direta, como se estivesse conversando falado.` },
          { role: "user", content: userText }
        ],
        model: "gpt-4-turbo-preview",
      });

      const aiResponseText = completion.choices[0].message.content;
      console.log("IA Respondeu:", aiResponseText);

      // 3. Clonar a voz (Chamando nossa API Local)
      await generateVoice(aiResponseText);

    } catch (error) {
      console.error("Erro no fluxo de voz:", error);
      alert("Erro ao processar conversa. Verifique se o backend de voz está rodando.");
    } finally {
      setIsProcessing(false);
    }
  };

  const generateVoice = async (text) => {
    if (!politicianVoiceRefUrl) {
      alert("Este político não tem um áudio de referência configurado.");
      return;
    }

    try {
      // Precisamos baixar o áudio de referência para enviar como arquivo
      // Ou, se o backend aceitar URL, melhor. Nosso backend atual aceita arquivo.
      // Vamos fazer um fetch do áudio de referência primeiro
      const audioRefResponse = await fetch(politicianVoiceRefUrl);
      const audioRefBlob = await audioRefResponse.blob();

      const formData = new FormData();
      formData.append('text', text);
      formData.append('speaker_wav', audioRefBlob, 'reference.wav');
      formData.append('language', 'pt');

      // Chamada para o serviço local Docker
      const voiceServiceUrl = import.meta.env.VITE_VOICE_SERVICE_URL || 'http://localhost:8005';
      const response = await fetch(`${voiceServiceUrl}/clone-speech`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Falha na geração de voz');

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      // Tocar automaticamente
      audioRef.current.src = url;
      audioRef.current.play();
      setIsPlaying(true);
      
      audioRef.current.onended = () => setIsPlaying(false);

    } catch (error) {
      console.error("Erro ao gerar voz:", error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-gray-900 rounded-lg border border-gray-800">
      <div className="text-gray-300 text-sm font-medium">
        Conversar com {politicianName}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing || isPlaying}
          className={`p-4 rounded-full transition-all ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-green-600 hover:bg-green-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isRecording ? <Square className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
        </button>

        {isPlaying && (
          <div className="flex items-center gap-2 text-green-400 animate-pulse">
            <Volume2 className="w-5 h-5" />
            <span className="text-xs">Falando...</span>
          </div>
        )}
      </div>

      {isProcessing && (
        <div className="flex items-center gap-2 text-yellow-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Processando resposta...</span>
        </div>
      )}

      {transcript && (
        <p className="text-gray-500 text-xs italic max-w-xs text-center">
          "{transcript}"
        </p>
      )}
    </div>
  );
};

export default VoiceChat;
