import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { arenaService, Arena } from '../services/arena';
import Header from '../components/user/Header';
import Sidebar from '../components/user/Sidebar';

const ArenaLobby = () => {
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadArenas();
  }, []);

  const loadArenas = async () => {
    try {
      const data = await arenaService.getArenas();
      setArenas(data);
    } catch (error) {
      console.error('Erro ao carregar arenas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-red-600 text-white animate-pulse';
      case 'scheduled': return 'bg-blue-600 text-white';
      case 'ended': return 'bg-gray-600 text-white';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'live': return 'AO VIVO';
      case 'scheduled': return 'AGENDADO';
      case 'ended': return 'ENCERRADO';
      default: return status;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Arena do Povo</h1>
                <p className="mt-2 text-gray-600">Participe de lives interativas com políticos e faça suas perguntas.</p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : arenas.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500 text-lg">Nenhuma arena agendada no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {arenas.map((arena) => (
                  <div key={arena.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-48 bg-gray-200 relative">
                      {arena.politicians?.photo_url ? (
                        <img 
                          src={arena.politicians.photo_url} 
                          alt={arena.politicians.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                          <span className="text-4xl">🏛️</span>
                        </div>
                      )}
                      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(arena.status)}`}>
                        {getStatusLabel(arena.status)}
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{arena.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{arena.description}</p>
                      
                      <div className="flex items-center mb-4">
                        <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">
                          {arena.politicians?.name || 'Convidado'}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {new Date(arena.scheduled_at).toLocaleString('pt-BR')}
                        </div>
                      </div>

                      <button 
                        onClick={() => navigate(`/arena/${arena.id}`)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                      >
                        {arena.status === 'live' ? 'Entrar na Arena' : 'Ver Detalhes'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ArenaLobby;
