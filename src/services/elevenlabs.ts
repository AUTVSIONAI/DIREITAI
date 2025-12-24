import axios from 'axios';

// Configuração da API do ElevenLabs
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
// OBS: Idealmente, esta chave deve vir de variáveis de ambiente (import.meta.env.VITE_ELEVENLABS_API_KEY)
// e as chamadas devem ser feitas através do seu backend para não expor a chave no frontend.
const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || ''; 

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export const ElevenLabsService = {
  /**
   * Gera áudio a partir de texto usando uma voz clonada ou pré-existente
   * @param text O texto para falar
   * @param voiceId O ID da voz no ElevenLabs (ex: ID da voz clonada do político)
   * @returns URL do blob de áudio para tocar
   */
  async textToSpeech(text: string, voiceId: string): Promise<string> {
    if (!API_KEY) {
      console.warn('ElevenLabs API Key não configurada');
      throw new Error('API Key do ElevenLabs ausente');
    }

    try {
      const response = await axios.post(
        `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}/stream`,
        {
          text,
          model_id: 'eleven_multilingual_v2', // Modelo que suporta melhor Português
          voice_settings: {
            stability: 0.5, // Ajuste para mais variabilidade (menos robótico)
            similarity_boost: 0.75, // Ajuste para fidelidade à voz original
            style: 0.0,
            use_speaker_boost: true
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': API_KEY,
            'Content-Type': 'application/json',
          },
          responseType: 'blob' // Importante para receber o áudio binário
        }
      );

      // Criar URL para o áudio
      return URL.createObjectURL(response.data);
    } catch (error) {
      console.error('Erro na geração de voz ElevenLabs:', error);
      throw error;
    }
  },

  /**
   * Lista as vozes disponíveis na conta (para descobrir os IDs das vozes clonadas)
   */
  async getVoices() {
    try {
      const response = await axios.get(`${ELEVENLABS_API_URL}/voices`, {
        headers: {
          'xi-api-key': API_KEY,
        }
      });
      return response.data.voices;
    } catch (error) {
      console.error('Erro ao listar vozes:', error);
      return [];
    }
  }
};
