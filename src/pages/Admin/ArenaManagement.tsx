import React, { useEffect, useState } from 'react';
import { arenaService, Arena } from '../../services/arena';
import { supabase } from '../../lib/supabase';

const ArenaManagement = () => {
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [politicians, setPoliticians] = useState<any[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    politician_id: '',
    scheduled_at: '',
    duration_minutes: 60,
    rules: 'Sem ofensas, sem spam.'
  });

  useEffect(() => {
    loadArenas();
    loadPoliticians();
  }, []);

  const loadArenas = async () => {
    try {
      const data = await arenaService.getArenas(); // Admin sees all because backend defaults to scheduled/live/ended
      setArenas(data);
    } catch (error) {
      console.error('Erro ao carregar arenas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPoliticians = async () => {
    const { data } = await supabase.from('politicians').select('id, name, party').order('name');
    if (data) setPoliticians(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await arenaService.createArena(formData);
      setShowModal(false);
      loadArenas();
      // Reset form
      setFormData({
        title: '',
        description: '',
        politician_id: '',
        scheduled_at: '',
        duration_minutes: 60,
        rules: 'Sem ofensas, sem spam.'
      });
    } catch (error) {
      console.error('Erro ao criar arena:', error);
      alert('Erro ao criar arena');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await arenaService.updateArena(id, { status: newStatus });
      loadArenas();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gerenciamento da Arena do Povo</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Nova Arena
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Convidado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {arenas.map((arena) => (
              <tr key={arena.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{arena.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{arena.politicians?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(arena.scheduled_at).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${arena.status === 'live' ? 'bg-red-100 text-red-800' : 
                      arena.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {arena.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {arena.status === 'scheduled' && (
                    <button onClick={() => handleStatusChange(arena.id, 'live')} className="text-green-600 hover:text-green-900 mr-3">Iniciar Live</button>
                  )}
                  {arena.status === 'live' && (
                    <button onClick={() => handleStatusChange(arena.id, 'ended')} className="text-red-600 hover:text-red-900 mr-3">Encerrar</button>
                  )}
                  <button className="text-indigo-600 hover:text-indigo-900">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Create */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Criar Nova Arena</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Título</label>
                <input 
                  type="text" 
                  className="w-full border rounded p-2"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Convidado</label>
                <select 
                  className="w-full border rounded p-2"
                  value={formData.politician_id}
                  onChange={e => setFormData({...formData, politician_id: e.target.value})}
                  required
                >
                  <option value="">Selecione um político</option>
                  {politicians.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.party})</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Data e Hora</label>
                <input 
                  type="datetime-local" 
                  className="w-full border rounded p-2"
                  value={formData.scheduled_at}
                  onChange={e => setFormData({...formData, scheduled_at: e.target.value})}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Descrição</label>
                <textarea 
                  className="w-full border rounded p-2"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Criar Arena
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArenaManagement;
