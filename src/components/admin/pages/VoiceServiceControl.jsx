import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Power, 
  RefreshCw, 
  Activity, 
  Cpu, 
  HardDrive,
  Play,
  Square
} from 'lucide-react';
import { apiRequest } from '../../../utils/apiClient';

const VoiceServiceControl = () => {
  const [status, setStatus] = useState('unknown'); // running, stopped, unknown
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [logs, setLogs] = useState([]);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/admin/docker/status');
      if (response.success) {
        setStatus(response.data.status);
        setDetails(response.data.details);
      } else {
        setStatus('unknown');
        setDetails('Erro ao verificar status');
      }
    } catch (error) {
      console.error('Failed to check status:', error);
      setStatus('unknown');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    try {
      setLoading(true);
      const response = await apiRequest(`/admin/docker/${action}`, {
        method: 'POST'
      });
      
      if (response.success) {
        addLog(`Comando '${action}' executado com sucesso.`);
        await checkStatus();
      } else {
        addLog(`Erro ao executar '${action}': ${response.error || response.data?.error}`);
      }
    } catch (error) {
      addLog(`Erro crítico: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addLog = (message) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'stopped': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Server className="w-8 h-8 text-blue-600" />
            Infraestrutura de Voz Local
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gerencie o container Docker do serviço de clonagem de voz XTTS v2
          </p>
        </div>
        <button 
          onClick={checkStatus}
          className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
          title="Atualizar Status"
        >
          <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full ${getStatusColor()} animate-pulse`} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Status do Serviço: {status === 'running' ? 'OPERACIONAL' : status === 'stopped' ? 'PARADO' : 'DESCONHECIDO'}
              </h3>
              <p className="text-sm text-gray-500">{details || 'Verificando...'}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Container</div>
            <div className="font-mono text-gray-900 dark:text-white">direitaai-voice</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleAction('start')}
            disabled={loading || status === 'running'}
            className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
              status === 'running' 
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
            }`}
          >
            <Play className="w-6 h-6" />
            <span className="font-semibold">Iniciar Serviço</span>
          </button>

          <button
            onClick={() => handleAction('stop')}
            disabled={loading || status !== 'running'}
            className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
              status !== 'running'
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
          >
            <Square className="w-6 h-6" />
            <span className="font-semibold">Parar Serviço</span>
          </button>

          <button
            onClick={() => handleAction('restart')}
            disabled={loading}
            className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
          >
            <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
            <span className="font-semibold">Reiniciar</span>
          </button>
        </div>
      </div>

      {/* Metrics / Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-500" />
            Informações do Sistema
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500">Modelo</span>
              <span className="font-medium">XTTS v2 (Multilingual)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500">Porta API</span>
              <span className="font-medium font-mono">8005</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500">Armazenamento</span>
              <span className="font-medium">Local (Volume Docker)</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-500">GPU</span>
              <span className="font-medium">{status === 'running' ? 'Ativo (se disponível)' : '-'}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 p-6 text-gray-300 font-mono text-sm h-64 overflow-y-auto">
          <h3 className="text-gray-100 font-semibold mb-4 flex items-center gap-2 sticky top-0 bg-gray-900 pb-2">
            <HardDrive className="w-4 h-4" />
            Logs de Operação
          </h3>
          {logs.length === 0 ? (
            <p className="text-gray-600 italic">Nenhuma atividade registrada nesta sessão.</p>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="border-l-2 border-blue-500 pl-2">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceServiceControl;
