import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Filter, UserCheck, Upload, Image } from 'lucide-react'
import { apiClient } from '../../../lib/api'
import { politiciansService } from '../../../services'
import { getPoliticianPhotoUrl } from '../../../utils/imageUtils'

const PoliticiansManagement = () => {
  const [politicians, setPoliticians] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterParty, setFilterParty] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPolitician, setEditingPolitician] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    party: '',
    position: '',
    city: '',
    state: '',
    country: '',
    short_bio: '',
    photo_url: '',
    social_links: {
      twitter: '',
      instagram: '',
      facebook: ''
    }
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    fetchPoliticians()
  }, [])

  const fetchPoliticians = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/politicians')
      // A API retorna { data: [...], pagination: {...} }
      setPoliticians(response.data?.data || [])
    } catch (error) {
      console.error('Erro ao carregar políticos:', error)
      setPoliticians([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      let photoUrl = formData.photo_url
      
      // Upload da foto se houver um arquivo selecionado
      if (photoFile) {
        const uploadedUrl = await uploadPhoto()
        if (uploadedUrl) {
          photoUrl = uploadedUrl
        }
      }
      
      const submitData = {
        ...formData,
        photo_url: photoUrl
      }
      
      if (editingPolitician) {
        await apiClient.put(`/politicians/${editingPolitician.id}`, submitData)
      } else {
        await apiClient.post('/politicians', submitData)
      }
      fetchPoliticians()
      resetForm()
    } catch (error) {
      console.error('Erro ao salvar político:', error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este político?')) {
      try {
        await apiClient.delete(`/politicians/${id}`)
        fetchPoliticians()
      } catch (error) {
        console.error('Erro ao excluir político:', error)
      }
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file && (file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png')) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setPhotoPreview(e.target.result)
      reader.readAsDataURL(file)
    } else {
      alert('Por favor, selecione um arquivo JPG, JPEG ou PNG')
    }
  }

  const uploadPhoto = async () => {
    if (!photoFile) return null
    
    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('photo', photoFile)
      
      const response = await politiciansService.uploadPhoto(formData)
      return response.url
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error)
      alert('Erro ao fazer upload da foto')
      return null
    } finally {
      setUploadingPhoto(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      party: '',
      position: '',
      city: '',
      state: '',
      country: '',
      short_bio: '',
      photo_url: '',
      social_links: {
        twitter: '',
        instagram: '',
        facebook: ''
      }
    })
    setPhotoFile(null)
    setPhotoPreview('')
    setEditingPolitician(null)
    setShowAddModal(false)
  }

  const startEdit = (politician) => {
    setFormData({
      name: politician.name || '',
      party: politician.party || '',
      position: politician.position || '',
      city: politician.city || '',
      state: politician.state || '',
      country: politician.country || '',
      short_bio: politician.short_bio || '',
      photo_url: politician.photo_url || '',
      social_links: politician.social_links || {
        twitter: '',
        instagram: '',
        facebook: ''
      }
    })
    setPhotoPreview(politician.photo_url || '')
    setEditingPolitician(politician)
    setShowAddModal(true)
  }

  const filteredPoliticians = Array.isArray(politicians) ? politicians.filter(politician => {
    const matchesSearch = politician.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         politician.party?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesParty = !filterParty || politician.party === filterParty
    return matchesSearch && matchesParty
  }) : []

  const parties = [...new Set(Array.isArray(politicians) ? politicians.map(p => p.party).filter(Boolean) : [])]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Políticos</h1>
          <p className="text-gray-600">Gerencie o cadastro de políticos da plataforma</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Político
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou partido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="w-48">
            <select
              value={filterParty}
              onChange={(e) => setFilterParty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os partidos</option>
              {parties.map(party => (
                <option key={party} value={party}>{party}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Politicians List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Político
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Partido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cargo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPoliticians.map((politician) => (
                <tr key={politician.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {politician.photo_url ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={getPoliticianPhotoUrl(politician.photo_url)}
                            alt={politician.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center ${politician.photo_url ? 'hidden' : ''}`}>
                          <UserCheck className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {politician.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {politician.party}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {politician.position}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEdit(politician)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(politician.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPoliticians.length === 0 && (
          <div className="text-center py-12">
            <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum político encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterParty ? 'Tente ajustar os filtros.' : 'Comece adicionando um novo político.'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingPolitician ? 'Editar Político' : 'Adicionar Político'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Partido</label>
                  <input
                    type="text"
                    required
                    value={formData.party}
                    onChange={(e) => setFormData({...formData, party: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cargo</label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cidade</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <input
                    type="text"
                    value={formData.state || ''}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">País</label>
                  <input
                    type="text"
                    value={formData.country || ''}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Image className="w-4 h-4 inline mr-1" />
                    Foto do Político
                  </label>
                  
                  {/* Preview da foto */}
                  {photoPreview && (
                    <div className="mb-3">
                      <img
                        src={photoFile ? photoPreview : getPoliticianPhotoUrl(photoPreview)}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-20 h-20 rounded-lg border border-gray-300 bg-gray-100 flex items-center justify-center text-gray-400 hidden">
                        <Image className="w-8 h-8" />
                      </div>
                    </div>
                  )}
                  
                  {/* Upload de arquivo */}
                  <div className="mb-3">
                    <label className="block text-sm text-gray-600 mb-1">Upload de Arquivo (JPG, JPEG, PNG)</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handlePhotoChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  
                  {/* URL alternativa */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Ou URL da Imagem</label>
                    <input
                      type="url"
                      value={formData.photo_url}
                      onChange={(e) => {
                        setFormData({...formData, photo_url: e.target.value})
                        setPhotoPreview(e.target.value)
                      }}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://exemplo.com/foto.jpg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Biografia</label>
                  <textarea
                    rows={3}
                    value={formData.short_bio}
                    onChange={(e) => setFormData({...formData, short_bio: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingPhoto}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {uploadingPhoto && <Upload className="w-4 h-4 animate-spin" />}
                    {uploadingPhoto ? 'Enviando...' : (editingPolitician ? 'Atualizar' : 'Adicionar')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PoliticiansManagement