import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { 
  Search, 
  Filter, 
  MapPin, 
  Users, 
  Award, 
  ExternalLink,
  MessageCircle,
  Bot,
  Globe,
  Instagram,
  Twitter,
  Facebook,
  Star,
  ArrowLeft
} from 'lucide-react';
import { getPoliticianPhotoUrl } from '../utils/imageUtils';

const Politicians = () => {
  const [politicians, setPoliticians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedParty, setSelectedParty] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const brazilianStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const commonParties = [
    'PL', 'PP', 'REPUBLICANOS', 'UNIÃO', 'PSD', 'MDB', 'PSDB',
    'PODEMOS', 'PDT', 'PSB', 'SOLIDARIEDADE', 'NOVO', 'PATRIOTA',
    'PROS', 'AVANTE', 'PMN', 'CIDADANIA', 'PV', 'REDE', 'PSL'
  ];

  const positions = [
    'Presidente', 'Vice-Presidente', 'Senador', 'Deputado Federal',
    'Deputado Estadual', 'Governador', 'Vice-Governador', 'Prefeito',
    'Vice-Prefeito', 'Vereador', 'Ministro', 'Secretário Estadual',
    'Secretário Municipal'
  ];

  useEffect(() => {
    fetchPoliticians();
  }, [currentPage, selectedState, selectedParty, selectedPosition, searchTerm]);

  const fetchPoliticians = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12'
      });

      if (selectedState) params.append('state', selectedState);
      if (selectedParty) params.append('party', selectedParty);
      if (selectedPosition) params.append('position', selectedPosition);
      if (searchTerm) params.append('search', searchTerm);
      
      // Usar dados reais para deputados federais
      if (selectedPosition === 'Deputado Federal' || selectedPosition === 'deputado') {
        params.append('use_real_data', 'true');
      }

      const response = await apiClient.get(`/politicians?${params.toString()}`);
      
      if (response.data.success) {
        setPoliticians(response.data.data);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Erro ao carregar políticos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPoliticians();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedState('');
    setSelectedParty('');
    setSelectedPosition('');
    setCurrentPage(1);
  };

  const getSocialIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="w-4 h-4" />;
      case 'twitter':
      case 'x':
        return <Twitter className="w-4 h-4" />;
      case 'facebook':
        return <Facebook className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-800 to-yellow-600 text-white">
        <div className="container mx-auto px-4 py-16">
          {/* Botão de Voltar */}
          <div className="mb-8">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-200 text-white font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar ao Dashboard
            </Link>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Diretório de Políticos
            </h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
              Conheça os representantes da direita brasileira, suas propostas e como entrar em contato
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Busca */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar políticos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </form>

            {/* Botão de Filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filtros
            </button>
          </div>

          {/* Filtros Expandidos */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Filtro por Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Todos os estados</option>
                    {brazilianStates.map(state => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Partido */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Partido
                  </label>
                  <select
                    value={selectedParty}
                    onChange={(e) => {
                      setSelectedParty(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Todos os partidos</option>
                    {commonParties.map(party => (
                      <option key={party} value={party}>
                        {party}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Cargo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargo
                  </label>
                  <select
                    value={selectedPosition}
                    onChange={(e) => {
                      setSelectedPosition(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Todos os cargos</option>
                    {positions.map(position => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Botão Limpar */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Limpar Filtros
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Grid de Políticos */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-300"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded mb-4 w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : politicians.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              Nenhum político encontrado
            </div>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {politicians.map(politician => (
              <div key={politician.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Foto */}
                <div className="h-48 overflow-hidden bg-gray-200">
                  {politician.photo_url ? (
                    <img
                      src={getPoliticianPhotoUrl(politician.photo_url)}
                      alt={politician.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center text-gray-400 ${politician.photo_url ? 'hidden' : ''}`}>
                    <Users className="w-16 h-16" />
                  </div>
                </div>

                <div className="p-6">
                  {/* Nome */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {politician.name}
                  </h3>

                  {/* Cargo e Partido */}
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Award className="w-4 h-4" />
                    <span className="text-sm">
                      {politician.position}
                    </span>
                  </div>

                  {/* Estado e Partido */}
                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">
                      {politician.state} • {politician.party}
                    </span>
                  </div>

                  {/* Avaliação */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(politician.average_rating || 0)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {politician.average_rating ? politician.average_rating.toFixed(1) : '0.0'}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({politician.total_votes || 0} {politician.total_votes === 1 ? 'voto' : 'votos'})
                    </span>
                  </div>

                  {/* Bio resumida */}
                  {politician.short_bio && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {politician.short_bio}
                    </p>
                  )}

                  {/* Redes Sociais */}
                  {politician.social_links && Object.keys(politician.social_links).length > 0 && (
                    <div className="flex gap-2 mb-4">
                      {Object.entries(politician.social_links).slice(0, 3).map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          title={platform}
                        >
                          {getSocialIcon(platform)}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex gap-2">
                    <Link
                      to={`/politicos/${politician.id}`}
                      className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors text-center"
                    >
                      Ver Perfil
                    </Link>
                    
                    {/* Botão do Agente IA (se disponível) */}
                    <Link
                      to={`/agente/${politician.id}`}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      title="Conversar com IA"
                    >
                      <Bot className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>

              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === page
                        ? 'bg-green-600 text-white'
                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-green-600 to-yellow-500 rounded-lg p-8 text-white text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Você é um político da direita?
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Cadastre-se em nossa plataforma e conecte-se com seus eleitores através de tecnologia de ponta
          </p>
          <Link
            to="/cadastro-politico"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Users className="w-5 h-5" />
            Cadastrar-se como Político
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Politicians;