import React, { useEffect, useState } from 'react';
import { arenaService, Arena } from '../../services/arena';
import { supabase } from '../../lib/supabase';
import { Search, UserPlus, X, Mail, Users, Check, AlertTriangle } from 'lucide-react';

const ArenaManagement = () => {
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [politicians, setPoliticians] = useState<any[]>([]);
  
  // Invite State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedArenaId, setSelectedArenaId] = useState<string | null>(null);
  const [inviteMode, setInviteMode] = useState<'search' | 'email'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [inviteRole, setInviteRole] = useState('journalist');
  const [newUserCreds, setNewUserCreds] = useState<any>(null);
  const [externalName, setExternalName] = useState('');
  const [externalEmail, setExternalEmail] = useState('');

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

  const handleOpenInvite = (arenaId: string) => {
    setSelectedArenaId(arenaId);
    setShowInviteModal(true);
    setNewUserCreds(null);
    setSearchQuery('');
    setSearchResults([]);
    setExternalName('');
    setExternalEmail('');
  };

  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
        const results = await arenaService.searchUsers(searchQuery);
        setSearchResults(results);
    } catch (error) {
        console.error('Error searching users:', error);
    }
  };

  const handleInviteUser = async (userId: string) => {
    if (!selectedArenaId) return;
    try {
        await arenaService.inviteUser(selectedArenaId, userId, inviteRole);
        alert('Convite enviado com sucesso!');
    } catch (error) {
        console.error('Error inviting user:', error);
        alert('Erro ao enviar convite.');
    }
  };

  const handleInviteExternal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArenaId || !externalName || !externalEmail) return;

    try {
        const response = await arenaService.inviteExternal(selectedArenaId, externalName, externalEmail, inviteRole);
        if (response.tempPassword) {
            setNewUserCreds({ email: externalEmail, password: response.tempPassword });
            setExternalName('');
            setExternalEmail('');
        } else if (response.participant) {
            alert('Usuário convidado com sucesso!');
            setShowInviteModal(false);
        }
    } catch (error) {
        console.error('Error inviting external user:', error);
        alert('Erro ao convidar usuário externo.');
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
                  <button onClick={() => handleOpenInvite(arena.id)} className="text-blue-600 hover:text-blue-900 mr-3 inline-flex items-center gap-1"><UserPlus size={16}/> Convidar</button>
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

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-lg border border-gray-200 p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Convidar Participante</h3>
                    <button onClick={() => setShowInviteModal(false)} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button>
                </div>

                {newUserCreds ? (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                        <h4 className="font-bold text-green-700 mb-2 flex items-center gap-2"><Check size={18} /> Usuário Criado!</h4>
                        <div className="flex items-start gap-2 mb-3 bg-yellow-50 p-2 rounded border border-yellow-100 text-yellow-800 text-sm">
                           <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                           <p><strong>Atenção:</strong> O envio automático de email pode falhar. Por favor, copie as credenciais abaixo e envie manualmente para o convidado.</p>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Credenciais de acesso:</p>
                        <div className="bg-gray-100 p-3 rounded text-sm font-mono select-all border border-gray-300 text-gray-800">
                            <p>Email: <span className="font-bold">{newUserCreds.email}</span></p>
                            <p>Senha: <span className="font-bold">{newUserCreds.password}</span></p>
                        </div>
                        <button 
                            onClick={() => { setNewUserCreds(null); setShowInviteModal(false); }}
                            className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-bold"
                        >
                            Concluído
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex gap-2 mb-4 border-b border-gray-200 pb-2">
                            <button 
                                onClick={() => setInviteMode('search')}
                                className={`pb-2 text-sm font-bold flex items-center gap-2 ${inviteMode === 'search' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                            >
                                <Search size={16} /> Buscar Usuário
                            </button>
                            <button 
                                onClick={() => setInviteMode('email')}
                                className={`pb-2 text-sm font-bold flex items-center gap-2 ${inviteMode === 'email' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                            >
                                <Mail size={16} /> Convidar Externo
                            </button>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm text-gray-600 mb-1 font-medium">Função na Arena</label>
                            <select 
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value)}
                                className="w-full bg-white rounded px-3 py-2 text-gray-800 border border-gray-300 focus:border-blue-500 outline-none"
                            >
                                <option value="journalist">Jornalista</option>
                                <option value="guest">Convidado</option>
                                <option value="moderator">Moderador</option>
                            </select>
                        </div>

                        {inviteMode === 'search' ? (
                            <>
                                <form onSubmit={handleSearchUsers} className="mb-4">
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Nome ou Email..."
                                            className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button type="submit" className="bg-blue-600 px-3 py-2 rounded hover:bg-blue-700 text-white">
                                            <Search className="w-5 h-5" />
                                        </button>
                                    </div>
                                </form>

                                <div className="max-h-60 overflow-y-auto space-y-2">
                                    {searchResults.map(user => (
                                        <div key={user.id} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden mr-2 flex items-center justify-center text-gray-500">
                                                    {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <Users size={16} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">{user.full_name}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                    <p className="text-[10px] text-gray-400 capitalize">{user.role}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleInviteUser(user.id)}
                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-bold"
                                            >
                                                Convidar
                                            </button>
                                        </div>
                                    ))}
                                    {searchResults.length === 0 && searchQuery && (
                                        <p className="text-center text-gray-500 text-sm mt-4">Nenhum usuário encontrado.</p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <form onSubmit={handleInviteExternal}>
                                <div className="mb-3">
                                    <label className="block text-sm text-gray-600 mb-1">Nome Completo</label>
                                    <input 
                                        type="text" 
                                        value={externalName}
                                        onChange={(e) => setExternalName(e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm text-gray-600 mb-1">Email</label>
                                    <input 
                                        type="email" 
                                        value={externalEmail}
                                        onChange={(e) => setExternalEmail(e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-4 text-xs text-blue-800">
                                    <p>Um usuário temporário será criado e as credenciais serão exibidas na próxima tela.</p>
                                </div>
                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-bold">
                                    Criar Convite
                                </button>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default ArenaManagement;
