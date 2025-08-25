import React, { useState } from 'react';
import { Download, Upload, RefreshCw, Users, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { politiciansService } from '../../services/politicians';

const PoliticianSync = () => {
  const [syncStatus, setSyncStatus] = useState({
    deputados: { loading: false, result: null, error: null },
    senadores: { loading: false, result: null, error: null },
    all: { loading: false, result: null, error: null },
    deputadosEstaduais: { loading: false, result: null, error: null },
    prefeitos: { loading: false, result: null, error: null },
    vereadores: { loading: false, result: null, error: null },
    allLocal: { loading: false, result: null, error: null }
  });

  const [selectedState, setSelectedState] = useState('SP');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');

  const handleSyncDeputados = async () => {
    setSyncStatus(prev => ({
      ...prev,
      deputados: { loading: true, result: null, error: null }
    }));

    try {
      const result = await politiciansService.syncDeputados();
      setSyncStatus(prev => ({
        ...prev,
        deputados: { loading: false, result, error: null }
      }));
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        deputados: { loading: false, result: null, error: error.message }
      }));
    }
  };

  const handleSyncSenadores = async () => {
    setSyncStatus(prev => ({
      ...prev,
      senadores: { loading: true, result: null, error: null }
    }));

    try {
      const result = await politiciansService.syncSenadores();
      setSyncStatus(prev => ({
        ...prev,
        senadores: { loading: false, result, error: null }
      }));
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        senadores: { loading: false, result: null, error: error.message }
      }));
    }
  };

  const handleSyncAll = async () => {
    setSyncStatus(prev => ({
      ...prev,
      all: { loading: true, result: null, error: null }
    }));

    try {
      const result = await politiciansService.syncAllPoliticians();
      setSyncStatus(prev => ({
        ...prev,
        all: { loading: false, result, error: null }
      }));
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        all: { loading: false, result: null, error: error.message }
      }));
    }
  };

  const handleSyncDeputadosEstaduais = async () => {
    setSyncStatus(prev => ({
      ...prev,
      deputadosEstaduais: { loading: true, result: null, error: null }
    }));

    try {
      const result = await politiciansService.syncDeputadosEstaduais(selectedState);
      setSyncStatus(prev => ({
        ...prev,
        deputadosEstaduais: { loading: false, result, error: null }
      }));
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        deputadosEstaduais: { loading: false, result: null, error: error.message }
      }));
    }
  };

  const handleSyncPrefeitos = async () => {
    setSyncStatus(prev => ({
      ...prev,
      prefeitos: { loading: true, result: null, error: null }
    }));

    try {
      const result = await politiciansService.syncPrefeitos(selectedState);
      setSyncStatus(prev => ({
        ...prev,
        prefeitos: { loading: false, result, error: null }
      }));
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        prefeitos: { loading: false, result: null, error: error.message }
      }));
    }
  };

  const handleSyncVereadores = async () => {
    if (!selectedMunicipality) {
      setSyncStatus(prev => ({
        ...prev,
        vereadores: { loading: false, result: null, error: 'Município é obrigatório para sincronizar vereadores' }
      }));
      return;
    }

    setSyncStatus(prev => ({
      ...prev,
      vereadores: { loading: true, result: null, error: null }
    }));

    try {
      const result = await politiciansService.syncVereadores(selectedState, selectedMunicipality);
      setSyncStatus(prev => ({
        ...prev,
        vereadores: { loading: false, result, error: null }
      }));
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        vereadores: { loading: false, result: null, error: error.message }
      }));
    }
  };

  const handleSyncAllLocal = async () => {
    setSyncStatus(prev => ({
      ...prev,
      allLocal: { loading: true, result: null, error: null }
    }));

    try {
      const result = await politiciansService.syncAllLocalPoliticians(selectedState, selectedMunicipality);
      setSyncStatus(prev => ({
        ...prev,
        allLocal: { loading: false, result, error: null }
      }));
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        allLocal: { loading: false, result: null, error: error.message }
      }));
    }
  };

  const SyncCard = ({ title, icon: Icon, status, onSync, description }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        <button
          onClick={onSync}
          disabled={status.loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status.loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Sincronizar
            </>
          )}
        </button>
      </div>

      {/* Status da sincronização */}
      {status.result && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-800">Sincronização Concluída</span>
          </div>
          <div className="text-sm text-green-700">
            <p>Total processados: {status.result.total}</p>
            <p>Sucessos: {status.result.success}</p>
            <p>Erros: {status.result.errors}</p>
          </div>
        </div>
      )}

      {status.error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-800">Erro na Sincronização</span>
          </div>
          <p className="text-sm text-red-700">{status.error}</p>
        </div>
      )}

      {status.loading && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-800">Processando dados...</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            Isso pode levar alguns minutos dependendo da quantidade de dados.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sincronização de Políticos
        </h1>
        <p className="text-gray-600">
          Sincronize dados de deputados e senadores com as APIs oficiais da Câmara dos Deputados e Senado Federal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SyncCard
          title="Deputados Federais"
          icon={Users}
          status={syncStatus.deputados}
          onSync={handleSyncDeputados}
          description="Sincronizar com API da Câmara dos Deputados"
        />

        <SyncCard
          title="Senadores"
          icon={Users}
          status={syncStatus.senadores}
          onSync={handleSyncSenadores}
          description="Sincronizar com API do Senado Federal"
        />
      </div>

      <div className="mb-8">
        <SyncCard
          title="Sincronização Completa"
          icon={Upload}
          status={syncStatus.all}
          onSync={handleSyncAll}
          description="Sincronizar deputados e senadores em uma única operação"
        />
      </div>

      {/* Seção de Políticos Locais */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Políticos Locais
        </h2>
        <p className="text-gray-600 mb-6">
          Sincronize dados de deputados estaduais, prefeitos e vereadores por estado e município.
        </p>

        {/* Controles de Estado e Município */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SP">São Paulo</option>
                <option value="RJ">Rio de Janeiro</option>
                <option value="MG">Minas Gerais</option>
                <option value="RS">Rio Grande do Sul</option>
                <option value="PR">Paraná</option>
                <option value="SC">Santa Catarina</option>
                <option value="BA">Bahia</option>
                <option value="GO">Goiás</option>
                <option value="PE">Pernambuco</option>
                <option value="CE">Ceará</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Município (opcional para vereadores)
              </label>
              <input
                type="text"
                value={selectedMunicipality}
                onChange={(e) => setSelectedMunicipality(e.target.value)}
                placeholder="Ex: São Paulo, Rio de Janeiro..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Cards de Sincronização Local */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SyncCard
            title={`Deputados Estaduais - ${selectedState}`}
            icon={Users}
            status={syncStatus.deputadosEstaduais}
            onSync={handleSyncDeputadosEstaduais}
            description={`Sincronizar deputados da Assembleia Legislativa de ${selectedState}`}
          />

          <SyncCard
            title={`Prefeitos - ${selectedState}`}
            icon={Users}
            status={syncStatus.prefeitos}
            onSync={handleSyncPrefeitos}
            description={`Sincronizar prefeitos do estado de ${selectedState}`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SyncCard
            title={selectedMunicipality ? `Vereadores - ${selectedMunicipality}` : 'Vereadores'}
            icon={Users}
            status={syncStatus.vereadores}
            onSync={handleSyncVereadores}
            description={selectedMunicipality ? `Sincronizar vereadores de ${selectedMunicipality}` : 'Selecione um município para sincronizar vereadores'}
          />

          <SyncCard
            title={`Sincronização Local Completa - ${selectedState}`}
            icon={Upload}
            status={syncStatus.allLocal}
            onSync={handleSyncAllLocal}
            description={`Sincronizar todos os políticos locais de ${selectedState}`}
          />
        </div>
      </div>

      {/* Informações importantes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-800 mb-2">Informações Importantes</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Os políticos sincronizados ficam com status "pendente" até aprovação manual</li>
              <li>• A sincronização não sobrescreve dados já existentes no sistema</li>
              <li>• Dados federais são obtidos das APIs oficiais do governo</li>
              <li>• Dados locais são simulados para demonstração (implementar APIs reais conforme necessário)</li>
              <li>• O processo pode demorar alguns minutos para grandes volumes de dados</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliticianSync;