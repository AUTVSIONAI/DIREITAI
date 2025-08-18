import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/api.ts';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Search, Filter, Calendar, User, Eye, Tag, Heart, MessageCircle, 
  Share2, TrendingUp, Zap, Globe, ArrowLeft, Star, Clock
} from 'lucide-react';

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [politicians, setPoliticians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPolitician, setSelectedPolitician] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const popularTags = [
    'Política Nacional', 'Economia', 'Segurança Pública', 'Educação',
    'Saúde', 'Meio Ambiente', 'Direitos Humanos', 'Tecnologia',
    'Agricultura', 'Infraestrutura', 'Justiça', 'Defesa'
  ];

  useEffect(() => {
    fetchPosts();
    fetchPoliticians();
  }, [currentPage, selectedPolitician, selectedTag, searchTerm]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12'
      });

      if (selectedPolitician) params.append('politician_id', selectedPolitician);
      if (selectedTag) params.append('tag', selectedTag);
      if (searchTerm) params.append('search', searchTerm);

      const response = await apiClient.get(`/blog?${params.toString()}`);
      
      if (response.data.success) {
        setPosts(response.data.data);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Erro ao carregar posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPoliticians = async () => {
    try {
      const response = await apiClient.get('/politicians?limit=100');
      if (response.data.success) {
        setPoliticians(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar políticos:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPosts();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedPolitician('');
    setSelectedTag('');
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    
    try {
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: ptBR
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error, 'Data original:', dateString);
      return 'Data não disponível';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header do Site de Notícias */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors">
                <ArrowLeft className="h-5 w-5" />
                <span>Voltar ao Dashboard</span>
              </Link>
              <Link to="/" className="text-2xl font-bold hover:text-blue-200 transition-colors">
                DireitAI News
              </Link>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/blog" className="hover:text-blue-200 transition-colors font-medium">Notícias</Link>
              <Link to="/politicos" className="hover:text-blue-200 transition-colors">Políticos</Link>
              <Link to="/verdade-ou-fake" className="hover:text-blue-200 transition-colors">Fact Check</Link>
            </nav>
          </div>
          
          {/* Hero Section */}
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Últimas Notícias
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Acompanhe as principais notícias e análises sobre política brasileira
            </p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filtros e Busca Modernizados */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 p-8 mb-8 relative overflow-hidden">
          {/* Efeito de brilho */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600"></div>
          
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Busca Avançada */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 w-5 h-5 transition-colors" />
                <input
                  type="text"
                  placeholder="Busque por notícias, análises, temas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-800 placeholder-gray-500 font-medium"
                />
                {/* Indicador de busca ativa */}
                {searchTerm && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            </form>

            {/* Botão de Filtros Modernizado */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`group flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                showFilters 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900'
              }`}
            >
              <Filter className={`w-5 h-5 transition-transform duration-300 ${
                showFilters ? 'rotate-180' : 'group-hover:rotate-12'
              }`} />
              <span>Filtros Avançados</span>
              {(selectedPolitician || selectedTag) && (
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
              )}
            </button>
          </div>

          {/* Filtros Expandidos Modernizados */}
          {showFilters && (
            <div className="mt-8 pt-8 border-t border-gray-300 relative">
              {/* Linha decorativa */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Filter className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Filtro por Político Modernizado */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase tracking-wide">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Político em Foco
                  </label>
                  <div className="relative">
                    <select
                      value={selectedPolitician}
                      onChange={(e) => {
                        setSelectedPolitician(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-800 font-medium appearance-none cursor-pointer hover:shadow-md"
                    >
                      <option value="">🏛️ Todos os políticos</option>
                      {politicians.map(politician => (
                        <option key={politician.id} value={politician.id}>
                          👤 {politician.name} - {politician.position}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-600"></div>
                    </div>
                  </div>
                </div>

                {/* Filtro por Categoria Modernizado */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase tracking-wide">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Categoria Temática
                  </label>
                  <div className="relative">
                    <select
                      value={selectedTag}
                      onChange={(e) => {
                        setSelectedTag(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 text-gray-800 font-medium appearance-none cursor-pointer hover:shadow-md"
                    >
                      <option value="">📂 Todas as categorias</option>
                      {popularTags.map(tag => (
                        <option key={tag} value={tag}>
                          📋 {tag}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-600"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Botão de Limpar Filtros */}
              {(selectedPolitician || selectedTag) && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <span>🗑️</span>
                    Limpar Filtros
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Posts Modernizados */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            // Loading skeleton modernizado
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden animate-pulse border border-gray-200/50">
                <div className="h-56 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse"></div>
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-2/3 animate-pulse"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-8 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-8 w-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))
          ) : posts.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Nenhum post encontrado</h3>
                <p className="text-gray-500 mb-6">Tente ajustar os filtros ou fazer uma nova busca para descobrir conteúdos incríveis.</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  🔄 Limpar Filtros
                </button>
              </div>
            </div>
          ) : (
            posts.map((post) => (
              <article key={post.id} className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 border border-gray-200/50 hover:border-blue-300/50 transform hover:-translate-y-2">
                {/* Imagem com overlay */}
                {post.featured_image_url && (
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={post.featured_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    {/* Overlay gradiente */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Badge de categoria */}
                    {post.politician_tags && post.politician_tags.length > 0 && (
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-blue-600/90 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-white/20">
                          👤 {post.politician_tags[0].tag_name}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-6 space-y-4">
                  {/* Título */}
                  <h2 className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
                    <Link to={`/blog/${post.slug}`} className="hover:underline">
                      {post.title}
                    </Link>
                  </h2>

                  {/* Excerpt */}
                  <p className="text-gray-600 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>

                  {/* Tags de Políticos */}
                  {post.politician_tags && post.politician_tags.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                      {post.politician_tags.slice(1).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200/50"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag.tag_name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Contadores Sociais */}
                  <div className="flex items-center justify-between py-3 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors">
                        <Heart className="w-4 h-4" />
                        <span className="font-medium">{post.likes_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        <span className="font-medium">{post.comments_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-green-500 hover:text-green-600 transition-colors">
                        <Share2 className="w-4 h-4" />
                        <span className="font-medium">{post.shares_count || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-medium">{post.views || 0}</span>
                    </div>
                  </div>

                  {/* Meta informações */}
                  <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {(post.politicians?.name || 'Admin').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium">Por {post.politicians?.name || 'Admin'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <time dateTime={post.created_at} className="font-medium">
                        {formatDate(post.created_at)}
                      </time>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Paginação Modernizada */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-12">
            {/* Botão Anterior */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`group flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 text-gray-700 hover:text-white shadow-lg hover:shadow-xl border border-gray-200 hover:border-transparent'
              }`}
            >
              <ArrowLeft className={`w-5 h-5 transition-transform duration-300 ${
                currentPage !== 1 ? 'group-hover:-translate-x-1' : ''
              }`} />
              <span className="hidden sm:inline">Anterior</span>
            </button>
            
            {/* Números das páginas */}
            <div className="flex items-center gap-2">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const page = i + Math.max(1, currentPage - 2);
                if (page > totalPages) return null;
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-12 h-12 rounded-xl font-bold transition-all duration-300 transform hover:scale-110 ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 scale-110'
                        : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-blue-600 border border-gray-200 hover:border-blue-300 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            {/* Botão Próximo */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`group flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 text-gray-700 hover:text-white shadow-lg hover:shadow-xl border border-gray-200 hover:border-transparent'
              }`}
            >
              <span className="hidden sm:inline">Próximo</span>
              <ArrowLeft className={`w-5 h-5 rotate-180 transition-transform duration-300 ${
                currentPage !== totalPages ? 'group-hover:translate-x-1' : ''
              }`} />
            </button>
          </div>
        )}
        
        {/* Informações da paginação */}
        {posts.length > 0 && (
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500 font-medium">
              Página <span className="text-blue-600 font-bold">{currentPage}</span> de{' '}
              <span className="text-blue-600 font-bold">{totalPages}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;