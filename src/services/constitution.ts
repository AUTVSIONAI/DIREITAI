import { apiClient } from '../lib/api';

export interface ConstitutionDownload {
  id: string;
  user_id: string;
  downloaded_at: string;
  points_awarded: number;
  created_at: string;
  updated_at: string;
}

export interface DownloadStatusResponse {
  hasDownloaded: boolean;
  downloadInfo: ConstitutionDownload | null;
}

export interface RegisterDownloadResponse {
  success: boolean;
  download: ConstitutionDownload;
  pointsAwarded: number;
}

export class ConstitutionService {
  /**
   * Verificar se o usuário já baixou a Constituição
   */
  static async getDownloadStatus(userId: string): Promise<DownloadStatusResponse> {
    try {
      const response = await apiClient.get(`/constitution/download-status/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar status de download:', error);
      throw error;
    }
  }

  /**
   * Registrar download da Constituição
   */
  static async registerDownload(userId: string): Promise<RegisterDownloadResponse> {
    try {
      const response = await apiClient.post(`/constitution/download/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao registrar download:', error);
      throw error;
    }
  }

  /**
   * Fazer download do arquivo PDF da Constituição
   */
  static downloadPDF(): void {
    try {
      const link = document.createElement('a');
      link.href = '/constituicao/constituicao.pdf';
      link.download = 'Constituicao-Federal-Brasil.pdf';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao fazer download da Constituição:', error);
      alert('Erro ao baixar a Constituição. Verifique se o arquivo está disponível.');
    }
  }
}