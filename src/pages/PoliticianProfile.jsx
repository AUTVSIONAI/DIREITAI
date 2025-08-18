import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { 
  ArrowLeft, 
  MapPin, 
  Award, 
  Calendar, 
  Globe, 
  Instagram, 
  Twitter, 
  Facebook, 
  Bot, 
  Star,
  MessageSquare,
  ThumbsUp,
  Send,
  Filter
} from 'lucide-react';
import { getPoliticianPhotoUrl } from '../utils/imageUtils';

const PoliticianProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [politician, setPolitician] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [userRating, setUserRating] = useState(null);
  const [ratingStats, setRatingStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [ratingsPage, setRatingsPage] = useState(1);
  const [ratingsPagination, setRatingsPagination] = useState(null);
  const [ratingsSort, setRatingsSort] = useState('recent');

  useEffect(() => {
    if (id) {
      fetchPolitician();
      fetchRatings();
      if (user) {
        fetchUserRating();
      }
    }
  }, [id, user]);

  useEffect(() => {
    fetchRatings();
  }, [ratingsPage, ratingsSort]);

  const fetchPolitician = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/politicians/${id}`);
      if (response.data.success) {
        setPolitician(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar político:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async () => {
    try {
      setRatingsLoading(true);
      const response = await apiClient.get(`/politicians/${id}/ratings?page=${ratingsPage}&sort=${ratingsSort}`);
      if (response.data.success) {
        setRatings(response.data.data);
        setRatingStats(response.data.stats);
        setRatingsPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    } finally {
      setRatingsLoading(false);
    }
  };

  const fetchUserRating = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await apiClient.get(`/politicians/${id}/user-rating`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUserRating(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar avaliação do usuário:', error);
    }
  };

  const submitRating = async () => {
    if (!user || newRating === 0) return;

    try {
      setSubmittingRating(true);
      const token = localStorage.getItem('token');
      
      const method = userRating ? 'put' : 'post';
      const response = await apiClient[method](`/politicians/${id}/ratings`, {
        rating: newRating,
        comment: newComment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setShowRatingModal(false);
        setNewRating(0);
        setNewComment('');
        fetchUserRating();
        fetchRatings();
        fetchPolitician(); // Atualizar estatísticas
      }
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
    } finally {
      setSubmittingRating(false);
    }
  };

  const deleteRating = async () => {
    if (!user || !userRating) return;

    try {
      const token = localStorage.getItem('token');
      await apiClient.delete(`/politicians/${id}/ratings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUserRating(null);
      fetchRatings();
      fetchPolitician();
    } catch (error) {
      console.error('Erro ao deletar avaliação:', error);
    }
  };

  const getSocialIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="w-5 h-5" />;
      case 'twitter':
      case 'x':
        return <Twitter className="w-5 h-5" />;
      case 'facebook':
        return <Facebook className="w-5 h-5" />;
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const openRatingModal = () => {
    if (userRating) {
      setNewRating(userRating.rating);
      setNewComment(userRating.comment || '');
    } else {
      setNewRating(0);
      setNewComment('');
    }
    setShowRatingModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!politician) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Político não encontrado</h2>
          <Link to="/politicos" className="text-green-600 hover:text-green-700">
            Voltar para o diretório
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              to="/dashboard" 
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar para o Dashboard
            </Link>
            <span className="text-gray-300">|</span>
            <Link 
              to="/politicos" 
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar para o Diretório
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Perfil Principal */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="md:flex">
                {/* Foto */}
                <div className="md:w-1/3">
                  <div className="h-64 md:h-full bg-gray-200">
                    {politician.photo_url ? (
                      <img
                        src={getPoliticianPhotoUrl(politician.photo_url)}
                        alt={politician.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center text-gray-400 ${politician.photo_url ? 'hidden' : ''}`}>
                      <Award className="w-16 h-16" />
                    </div>
                  </div>
                </div>

                {/* Informações */}
                <div className="md:w-2/3 p-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {politician.name}
                  </h1>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Award className="w-5 h-5" />
                      <span>{politician.position}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-5 h-5" />
                      <span>{politician.state} • {politician.party}</span>
                    </div>

                    {politician.birth_date && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-5 h-5" />
                        <span>Nascido em {formatDate(politician.birth_date)}</span>
                      </div>
                    )}
                  </div>

                  {/* Avaliação */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-6 h-6 ${
                              star <= Math.round(politician.average_rating || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-lg font-semibold text-gray-700">
                        {politician.average_rating ? politician.average_rating.toFixed(1) : '0.0'}
                      </span>
                      <span className="text-gray-500">
                        ({politician.total_votes || 0} {politician.total_votes === 1 ? 'avaliação' : 'avaliações'})
                      </span>
                    </div>

                    {user && (
                      <div className="flex gap-2">
                        <button
                          onClick={openRatingModal}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          {userRating ? 'Editar Avaliação' : 'Avaliar'}
                        </button>
                        {userRating && (
                          <button
                            onClick={deleteRating}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Remover Avaliação
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Redes Sociais */}
                  {politician.social_links && Object.keys(politician.social_links).length > 0 && (
                    <div className="flex gap-3">
                      {Object.entries(politician.social_links).map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          title={platform}
                        >
                          {getSocialIcon(platform)}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Biografia */}
            {politician.short_bio && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Biografia</h2>
                <div className="prose max-w-none text-gray-700">
                  {politician.short_bio.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Avaliações */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Avaliações</h2>
                <select
                  value={ratingsSort}
                  onChange={(e) => setRatingsSort(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="recent">Mais Recentes</option>
                  <option value="rating_high">Maior Avaliação</option>
                  <option value="rating_low">Menor Avaliação</option>
                </select>
              </div>

              {ratingsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando avaliações...</p>
                </div>
              ) : ratings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma avaliação ainda</p>
                  {user && (
                    <button
                      onClick={openRatingModal}
                      className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Seja o primeiro a avaliar
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {ratings.map((rating) => (
                    <div key={rating.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {rating.users?.avatar_url ? (
                            <img
                              src={rating.users.avatar_url}
                              alt={rating.users.full_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 font-semibold">
                                {rating.users?.full_name?.charAt(0) || '?'}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">
                              {rating.users?.full_name || 'Usuário'}
                            </span>
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= rating.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatDate(rating.created_at)}
                            </span>
                          </div>
                          
                          {rating.comment && (
                            <p className="text-gray-700">{rating.comment}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Paginação */}
                  {ratingsPagination && ratingsPagination.pages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      {Array.from({ length: ratingsPagination.pages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setRatingsPage(page)}
                          className={`px-3 py-2 rounded-lg ${
                            page === ratingsPage
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Estatísticas de Avaliação */}
            {ratingStats && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Distribuição de Avaliações</h3>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 w-8">{stars}</span>
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{
                            width: `${ratingStats.total > 0 && ratingStats.distribution ? (ratingStats.distribution[stars] / ratingStats.total) * 100 : 0}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8">
                        {ratingStats.distribution ? ratingStats.distribution[stars] || 0 : 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agente IA */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Converse com IA</h3>
              <p className="text-gray-600 text-sm mb-4">
                Converse com um agente de IA treinado com as informações e posicionamentos deste político.
              </p>
              <Link
                to={`/agente/${politician.id}`}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Bot className="w-5 h-5" />
                Iniciar Conversa
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Avaliação */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {userRating ? 'Editar Avaliação' : 'Avaliar Político'}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sua avaliação
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setNewRating(star)}
                    className="p-1"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= newRating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300 hover:text-yellow-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentário (opcional)
              </label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Compartilhe sua opinião sobre este político..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={submitRating}
                disabled={newRating === 0 || submittingRating}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingRating ? 'Enviando...' : (userRating ? 'Atualizar' : 'Enviar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoliticianProfile;