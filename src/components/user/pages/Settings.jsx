import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Bell, Lock, User, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Settings = () => {
  const { user, userProfile } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configurações</h1>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{userProfile?.full_name || 'Usuário'}</h2>
              <p className="text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {/* Notifications */}
          <div className="p-6 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-6 w-6 text-gray-400" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Notificações</h3>
                  <p className="text-sm text-gray-500">Gerencie como você recebe notificações.</p>
                </div>
              </div>
              <button className="text-primary-600 hover:text-primary-700 font-medium">Editar</button>
            </div>
          </div>

          {/* Security */}
          <div className="p-6 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Lock className="h-6 w-6 text-gray-400" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Segurança</h3>
                  <p className="text-sm text-gray-500">Altere sua senha e configure a autenticação.</p>
                </div>
              </div>
              <button className="text-primary-600 hover:text-primary-700 font-medium">Editar</button>
            </div>
          </div>

          {/* Privacy */}
          <div className="p-6 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6 text-gray-400" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Privacidade</h3>
                  <p className="text-sm text-gray-500">Controle quem pode ver suas informações.</p>
                </div>
              </div>
              <button className="text-primary-600 hover:text-primary-700 font-medium">Editar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
