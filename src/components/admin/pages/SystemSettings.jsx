import React, { useState, useEffect } from 'react';
import { 
  Cog6ToothIcon, 
  ShieldCheckIcon, 
  ServerIcon, 
  BellIcon,
  KeyIcon,
  CircleStackIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { Upload, X, Check } from 'lucide-react';
import { AdminService } from '../../../services/admin';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    general: {
      siteName: 'DireitAI',
      siteDescription: 'Plataforma de Educação Jurídica com IA',
      siteLogo: null,
      maintenanceMode: false,
      registrationEnabled: true,
      maxUsersPerEvent: 500
    },
    security: {
      minPasswordLength: 8,
      sessionTimeout: 3600,
      twoFactorEnabled: false,
      maxLoginAttempts: 5
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      emailProvider: 'smtp',
      smsProvider: 'twilio'
    },
    system: {
      maxFileSize: 10485760,
      apiRateLimit: 1000,
      backupFrequency: 'daily',
      logLevel: 'info'
    }
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Carregar configurações do backend
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const response = await AdminService.getSystemSettings();
        setSettings(response.settings);
        
        // Se houver logo salvo, definir o preview
        if (response.settings.general?.siteLogo) {
          setLogoPreview(response.settings.general.siteLogo);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        setMessage('Erro ao carregar configurações do sistema');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Incluir o logo no objeto de configurações
      const updatedSettings = {
        ...settings,
        general: {
          ...settings.general,
          siteLogo: logoPreview
        }
      };
      
      // Salvar configurações no backend
      await AdminService.updateSystemSettings(updatedSettings);
      
      setMessage('Configurações salvas com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Erro ao salvar configurações.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage('Formato de arquivo não suportado. Use JPG, PNG, SVG ou WebP.');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Arquivo muito grande. Tamanho máximo: 5MB.');
      return;
    }

    setUploadingLogo(true);
    try {
      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Simular upload (aqui você implementaria o upload real)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSettings(prev => ({ ...prev, siteLogo: file.name }));
      setMessage('Logo carregado com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Erro ao carregar logo.');
      setLogoPreview(null);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setSettings(prev => ({ ...prev, siteLogo: null }));
    setLogoPreview(null);
    setMessage('Logo removido.');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // Simular evento de input para reutilizar a lógica de upload
      const fakeEvent = {
        target: {
          files: [file]
        }
      };
      handleLogoUpload(fakeEvent);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Configurações do Sistema
          </h3>

          {message && (
            <div className={`mb-4 p-4 rounded-md ${
              message.includes('sucesso') 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Configurações Gerais */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 flex items-center">
                <Cog6ToothIcon className="h-5 w-5 mr-2" />
                Configurações Gerais
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nome do Site
                </label>
                <input
                  type="text"
                  value={settings.general?.siteName || ''}
                  onChange={(e) => handleInputChange('general', 'siteName', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Descrição do Site
                </label>
                <textarea
                  value={settings.general?.siteDescription || ''}
                  onChange={(e) => handleInputChange('general', 'siteDescription', e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Logo do Site */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo do Site
                </label>
                
                {/* Preview do Logo */}
                {(logoPreview || settings.general?.siteLogo) && (
                  <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {logoPreview && (
                          <img 
                            src={logoPreview} 
                            alt="Preview do logo" 
                            className="h-16 w-16 object-contain rounded-md border border-gray-200 bg-white p-1"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {settings.siteLogo || 'Logo carregado'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Logo atual do site
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveLogo}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                        title="Remover logo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload do Logo */}
                <div 
                  className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                    dragActive 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="space-y-1 text-center">
                    <PhotoIcon className={`mx-auto h-12 w-12 ${
                      dragActive ? 'text-blue-500' : 'text-gray-400'
                    }`} />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>{uploadingLogo ? 'Carregando...' : 'Carregar logo'}</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept="image/jpeg,image/png,image/svg+xml,image/webp"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                        />
                      </label>
                      <p className="pl-1">ou arraste e solte</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, SVG, WebP até 5MB
                    </p>
                    {dragActive && (
                      <p className="text-sm text-blue-600 font-medium">
                        Solte o arquivo aqui!
                      </p>
                    )}
                    {uploadingLogo && (
                      <div className="flex items-center justify-center mt-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-sm text-gray-600">Carregando...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.system?.maintenanceMode || false}
                  onChange={(e) => handleInputChange('system', 'maintenanceMode', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Modo de Manutenção
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.general?.registrationEnabled || false}
                  onChange={(e) => handleInputChange('general', 'registrationEnabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Permitir Novos Registros
                </label>
              </div>
            </div>

            {/* Configurações de Segurança */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 flex items-center">
                <ShieldCheckIcon className="h-5 w-5 mr-2" />
                Segurança
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Comprimento Mínimo da Senha
                </label>
                <input
                  type="number"
                  value={settings.security?.passwordMinLength || 8}
                  onChange={(e) => handleInputChange('security', 'passwordMinLength', parseInt(e.target.value))}
                  min="6"
                  max="20"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Timeout de Sessão (minutos)
                </label>
                <input
                  type="number"
                  value={settings.security?.sessionTimeout || 30}
                  onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
                  min="5"
                  max="120"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.security?.twoFactorAuth || false}
                  onChange={(e) => handleInputChange('security', 'twoFactorAuth', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Autenticação de Dois Fatores
                </label>
              </div>
            </div>

            {/* Configurações de Notificação */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 flex items-center">
                <BellIcon className="h-5 w-5 mr-2" />
                Notificações
              </h4>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifications?.emailNotifications || false}
                  onChange={(e) => handleInputChange('notifications', 'emailNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Notificações por Email
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifications?.smsNotifications || false}
                  onChange={(e) => handleInputChange('notifications', 'smsNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Notificações por SMS
                </label>
              </div>
            </div>

            {/* Configurações do Sistema */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 flex items-center">
                <ServerIcon className="h-5 w-5 mr-2" />
                Sistema
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tamanho Máximo de Arquivo (MB)
                </label>
                <input
                  type="number"
                  value={settings.system?.maxFileSize || 10}
                  onChange={(e) => handleInputChange('system', 'maxFileSize', parseInt(e.target.value))}
                  min="1"
                  max="100"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Limite de Taxa da API (req/min)
                </label>
                <input
                  type="number"
                  value={settings.system?.apiRateLimit || 100}
                  onChange={(e) => handleInputChange('system', 'apiRateLimit', parseInt(e.target.value))}
                  min="100"
                  max="10000"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Frequência de Backup
                </label>
                <select
                  value={settings.system?.backupFrequency || 'daily'}
                  onChange={(e) => handleInputChange('system', 'backupFrequency', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="hourly">A cada hora</option>
                  <option value="daily">Diariamente</option>
                  <option value="weekly">Semanalmente</option>
                  <option value="monthly">Mensalmente</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;