import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '../components/common/SEO';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { PoliticiansService } from '../services/politicians';
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
  Filter,
  DollarSign,
  Users,
  TrendingUp,
  PieChart,
  RefreshCw,
  AlertTriangle,
  Info
} from 'lucide-react';
import { getPoliticianPhotoUrl } from '../utils/imageUtils';
import { supabase } from '../lib/supabase';

// Função para formatar datas
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

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
  
  // Estados para gastos e servidores


  const [staffData, setStaffData] = useState(null);
  const [staffLoading, setStaffLoading] = useState(false);
  const [transparencyData, setTransparencyData] = useState(null);
  const [transparencyLoading, setTransparencyLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2025);

  const [suggestionModal, setSuggestionModal] = useState(false);
  const [suggestionText, setSuggestionText] = useState('');
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPolitician();
      fetchRatings();
      if (user) {
        fetchUserRating();
      }
    }
  }, [id, user, selectedYear]);

  const handleSuggestionSubmit = async () => {
    if (!user) {
      alert('Você precisa estar logado para enviar uma sugestão.');
      return;
    }
    if (!suggestionText.trim()) {
      alert('Por favor, digite sua sugestão.');
      return;
    }

    try {
      setSubmittingSuggestion(true);
      
      // Verificar se já enviou sugestão este mês
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Usando supabase diretamente pois não temos endpoint de sugestão ainda
      // Tentar tabela 'politician_suggestions'
      try {
        const { count } = await supabase
          .from('politician_suggestions')
          .select('*', { count: 'exact', head: true })
          .eq('politician_id', id)
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth.toISOString());

        if (count > 0) {
          alert('Você já enviou uma sugestão para este político este mês. Tente novamente no próximo mês.');
          return;
        }

        const { error } = await supabase
          .from('politician_suggestions')
          .insert({
            politician_id: id,
            user_id: user.id,
            content: suggestionText,
            created_at: new Date().toISOString()
          });

        if (error) {
           // Se a tabela não existir, criar tabela via SQL (se possível) ou alertar
           if (error.code === '42P01') {
             alert('Sistema de sugestões temporariamente indisponível (tabela não encontrada).');
             console.error('Faltando tabela politician_suggestions');
           } else {
             throw error;
           }
        } else {
          alert('Sugestão enviada com sucesso! O político receberá sua mensagem.');
          setSuggestionModal(false);
          setSuggestionText('');
        }
      } catch (err) {
        console.error('Erro ao enviar sugestão:', err);
        alert('Erro ao enviar sugestão.');
      }
    } finally {
      setSubmittingSuggestion(false);
    }
  };

  useEffect(() => {
    if (politician) {
      fetchTransparencyData();
    }
  }, [politician, selectedYear]);

  useEffect(() => {
    fetchRatings();
  }, [ratingsPage, ratingsSort]);

  const fetchPolitician = async () => {
    try {
      setLoading(true);
      // Tentar primeiro com dados reais se for ID numérico (deputado federal)
      let response;
      if (!isNaN(id) && id.length >= 5) {
        try {
          response = await apiClient.get(`/politicians/${id}?use_real_data=true`);
        } catch (realDataError) {
          console.log('Dados reais não disponíveis, usando dados do Supabase');
          response = await apiClient.get(`/politicians/${id}`);
        }
      } else {
        response = await apiClient.get(`/politicians/${id}`);
      }
      
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
    setRatingsLoading(true)
    try {
      const response = await apiClient.get(`/politicians/${id}/ratings`, {
        params: { page: ratingsPage, sort: ratingsSort }
      })
      const ratingsList = response?.data?.data || []
      let enriched = Array.isArray(ratingsList) ? [...ratingsList] : []
      if (!enriched.some(r => r && r.users)) {
        const userIds = [...new Set(enriched.map(r => r?.user_id).filter(Boolean))]
        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, full_name, name, username, email, avatar_url')
            .in('id', userIds)
          const usersById = Object.fromEntries((usersData || []).map(u => [u.id, u]))
          enriched = enriched.map(r => ({ ...r, users: usersById[r?.user_id] || r.users || null }))
        }
      }
      setRatings(enriched)
      // Atualiza estatísticas de avaliação
      const total = enriched.length
      const sum = enriched.reduce((acc, r) => acc + (Number(r.rating) || 0), 0)
      const avg = total > 0 ? Number((sum / total).toFixed(1)) : 0
      const distribution = { 5:0, 4:0, 3:0, 2:0, 1:0 }
      enriched.forEach(r => {
        const s = Number(r.rating) || 0
        if (distribution[s] !== undefined) distribution[s] += 1
      })
      setRatingStats({ total, distribution, average_rating: avg })
      // Paginação do backend se disponível
      setRatingsPagination(response?.data?.pagination || null)
      setRatingsLoading(false)
    } catch (error) {
      console.warn('Falha ao buscar ratings via API, tentando Supabase:', error)
      try {
        const { data, error: sbError } = await supabase
          .from('politician_ratings')
          .select('*')
          .eq('politician_id', id)
          .order('created_at', { ascending: false })
        if (sbError) throw sbError
        let list = Array.isArray(data) ? data : []
        const userIds = [...new Set(list.map(r => r?.user_id).filter(Boolean))]
        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, full_name, name, username, email, avatar_url')
            .in('id', userIds)
          const usersById = Object.fromEntries((usersData || []).map(u => [u.id, u]))
          list = list.map(r => ({ ...r, users: usersById[r?.user_id] || null }))
        }
        setRatings(list)
        // Estatísticas calculadas localmente
        const total = list.length
        const sum = list.reduce((acc, r) => acc + (Number(r.rating) || 0), 0)
        const avg = total > 0 ? Number((sum / total).toFixed(1)) : 0
        const distribution = { 5:0, 4:0, 3:0, 2:0, 1:0 }
        list.forEach(r => {
          const s = Number(r.rating) || 0
          if (distribution[s] !== undefined) distribution[s] += 1
        })
        setRatingStats({ total, distribution, average_rating: avg })
        setRatingsPagination({ page: 1, pages: 1, per_page: total })
      } catch (sbErr) {
        console.error('Erro ao buscar ratings no Supabase:', sbErr)
        setRatings([])
        setRatingStats({ total: 0, distribution: {5:0,4:0,3:0,2:0,1:0}, average_rating: 0 })
        setRatingsPagination(null)
      } finally {
        setRatingsLoading(false)
      }
    }
  }

  const fetchUserRating = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // Fallback Supabase: usuário autenticado via Supabase
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        if (!sbUser) return;
        const { data, error: sbErr } = await supabase
          .from('politician_ratings')
          .select('*')
          .eq('politician_id', id)
          .eq('user_id', sbUser.id)
          .limit(1)
          .maybeSingle();
        if (!sbErr && data) setUserRating(data);
        return;
      }

      const response = await apiClient.get(`/politicians/${id}/user-rating`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUserRating(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar avaliação do usuário (API), tentando Supabase:', error);
      try {
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        if (!sbUser) return;
        const { data, error: sbErr } = await supabase
          .from('politician_ratings')
          .select('*')
          .eq('politician_id', id)
          .eq('user_id', sbUser.id)
          .limit(1)
          .maybeSingle();
        if (!sbErr && data) setUserRating(data);
      } catch (sbErr2) {
        console.error('Fallback Supabase falhou ao carregar avaliação do usuário:', sbErr2);
      }
    }
  };

  const fetchTransparencyData = async () => {
    try {

      setTransparencyLoading(true);

      let response;
      
      // Escolher o método correto baseado no nível do político
      if (politician.position === 'Deputado Federal' || politician.position === 'deputado' || politician.position === 'Senador' || politician.position === 'senador') {

        response = await PoliticiansService.getTransparencyData(id, selectedYear);
      } else if (politician.position === 'Deputado Estadual') {
        response = await PoliticiansService.getStateDeputyTransparencyData(id, selectedYear);
      } else if (politician.position === 'Prefeito') {
        response = await PoliticiansService.getMayorTransparencyData(id, selectedYear);
      } else if (politician.position === 'Vereador') {
        response = await PoliticiansService.getCouncilorTransparencyData(id, selectedYear);
      } else {
        console.log('Tipo de político não suportado para dados de transparência:', politician.position);
        setTransparencyLoading(false);
        return;
      }
      
      if (response.success) {
        setTransparencyData(response.data);
        
        // Mapear dados de gastos para compatibilidade
        const expenses = response.data.expenses;
        const mappedSummary = {
          totalGasto: expenses.total_year || 0,
          mediaMensal: expenses.average_monthly || 0,
          categorias: expenses.categories ? Object.entries(expenses.categories).map(([nome, data]) => ({
            nome,
            valor: data.total
          })) : [],
          periodo: expenses.summary.period
        };
        // Dados de gastos agora vêm da transparencyData
        
        // Mapear dados de equipe
        const staffMembers = response.data.staff.members || [];
        setStaffData(staffMembers);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de transparência:', error);
      setTransparencyData(null);
      // Dados de gastos resetados com transparencyData
      setStaffData([]);
    } finally {
      
      setTransparencyLoading(false);
    }
  };



  const fetchStaffData = async () => {
    try {
      setStaffLoading(true);
      // Usar endpoint unificado para todos os tipos de políticos
      const response = await apiClient.get(`/admin/politicians/staff/${politician.id}`);
      if (response.data.success) {
        setStaffData(response.data.data.staff);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de servidores:', error);
      setStaffData(null);
    } finally {
      setStaffLoading(false);
    }
  };

  const refreshExpensesData = () => {
    if (politician) {
      fetchTransparencyData();
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const submitRating = async () => {
    if (!user || newRating === 0) return;

    try {
      setSubmittingRating(true);
      const token = localStorage.getItem('token');
      
      const method = userRating ? 'put' : 'post';
      const response = await apiClient[method](`/politicians/${id}/ratings`, {
        rating: newRating,
        comment: newComment || null
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
      console.error('Erro ao enviar avaliação (API), tentando Supabase:', error);
      try {
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        if (!sbUser) throw new Error('Usuário não autenticado no Supabase');
        // Buscar existente
        const { data: existing, error: findErr } = await supabase
          .from('politician_ratings')
          .select('id')
          .eq('politician_id', id)
          .eq('user_id', sbUser.id)
          .limit(1)
          .maybeSingle();
        if (findErr && findErr.code !== 'PGRST116') throw findErr;
        if (existing && existing.id) {
          const { error: updErr } = await supabase
            .from('politician_ratings')
            .update({ rating: newRating, comment: newComment || null })
            .eq('id', existing.id);
          if (updErr) throw updErr;
        } else {
          const { error: insErr } = await supabase
            .from('politician_ratings')
            .insert({ politician_id: id, user_id: sbUser.id, rating: newRating, comment: newComment || null });
          if (insErr) throw insErr;
        }
        setShowRatingModal(false);
        setNewRating(0);
        setNewComment('');
        fetchUserRating();
        fetchRatings();
        fetchPolitician();
      } catch (sbErr) {
        console.error('Fallback Supabase falhou ao enviar avaliação:', sbErr);
      }
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
      console.error('Erro ao deletar avaliação (API), tentando Supabase:', error);
      try {
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        if (!sbUser) return;
        const { data: existing, error: findErr } = await supabase
          .from('politician_ratings')
          .select('id')
          .eq('politician_id', id)
          .eq('user_id', sbUser.id)
          .limit(1)
          .maybeSingle();
        if (!findErr && existing && existing.id) {
          const { error: delErr } = await supabase
            .from('politician_ratings')
            .delete()
            .eq('id', existing.id);
          if (delErr) throw delErr;
          setUserRating(null);
          fetchRatings();
          fetchPolitician();
        }
      } catch (sbErr2) {
        console.error('Fallback Supabase falhou ao deletar avaliação:', sbErr2);
      }
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
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  // Helpers de exibição para nome de usuário em avaliações
  const getUserDisplayName = (user) => {
    if (!user) return null
    return user.full_name || user.name || user.username || (user.email ? user.email.split('@')[0] : null)
  }
  const getRatingUserName = (rating) => {
    return getUserDisplayName(rating.users) || 'Usuário anônimo'
  }
  const getRatingUserInitial = (rating) => {
    const name = getRatingUserName(rating)
    return name ? name.charAt(0).toUpperCase() : '?'
  }
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

  const title = `${politician.nome_urna || politician.name || 'Político'} - ${politician.cargo || politician.position || 'Político'} (${politician.partido || politician.party || ''})`;
  const description = politician.biografia || politician.short_bio || `Acompanhe o perfil de ${politician.nome_urna || politician.name} no DireitaAI.`;
  const image = getPoliticianPhotoUrl(politician.photo_url || politician.url_foto);

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title={title}
        description={description}
        image={image}
        type="profile"
      />
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
                  <div className="flex justify-between items-start">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                      {politician.name}
                    </h1>
                    <button
                      onClick={() => setSuggestionModal(true)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      title="Enviar Sugestão"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Sugestão
                    </button>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Award className="w-5 h-5" />
                      <span>{politician.position}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-5 h-5" />
                      <span>
                        {politician.municipality ? `${politician.municipality}, ` : ''}
                        {politician.state} • {politician.party}
                        {politician.level && politician.level !== 'federal' && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {politician.level === 'estadual' ? 'Estadual' : 'Municipal'}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Avaliação */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-6 h-6 ${
                              star <= Math.round(Number(ratingStats?.average_rating || 0))
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-lg font-semibold text-gray-700">
                        {Number(ratingStats?.average_rating || 0).toFixed(1)}
                      </span>
                      <span className="text-gray-500">
                        ({ratingStats?.total ?? 0} {(ratingStats?.total ?? 0) === 1 ? 'avaliação' : 'avaliações'})
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

                {/* Indicadores de Transparência */}
                {transparencyData && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-orange-600" />
                      Indicadores de Transparência
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Score de Transparência */}
                      {transparencyData.transparency_score && (
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <div className="text-sm text-orange-600 font-medium">Score de Transparência</div>
                          <div className="text-2xl font-bold text-orange-800">
                            {transparencyData.transparency_score.overall_score}/100
                          </div>
                          <div className="text-xs text-orange-600 mt-1">
                            {transparencyData.transparency_score.classification}
                          </div>
                        </div>
                      )}
                      
                      {/* Funcionários Fantasma */}
                      {transparencyData.ghost_employees && (
                        <div className="bg-red-50 p-4 rounded-lg">
                          <div className="text-sm text-red-600 font-medium">Funcionários Fantasma</div>
                          <div className="text-2xl font-bold text-red-800">
                            {transparencyData.ghost_employees.suspicious_count || 0}
                          </div>
                          <div className="text-xs text-red-600 mt-1">
                            {transparencyData.ghost_employees.risk_level || 'Baixo'} risco
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Detalhes dos Indicadores */}
                    {(transparencyData.transparency_score?.details || transparencyData.ghost_employees?.indicators) && (
                      <div className="mt-4 space-y-3">
                        {transparencyData.transparency_score?.details && (
                          <div className="bg-gray-50 p-3 rounded">
                            <div className="text-sm font-medium text-gray-700 mb-2">Detalhes da Transparência:</div>
                            <div className="text-xs text-gray-600 space-y-1">
                              {Object.entries(transparencyData.transparency_score.details).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>
                                  <span className="font-medium">{value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {transparencyData.ghost_employees?.indicators && (
                          <div className="bg-gray-50 p-3 rounded">
                            <div className="text-sm font-medium text-gray-700 mb-2">Indicadores de Risco:</div>
                            <div className="text-xs text-gray-600 space-y-1">
                              {transparencyData.ghost_employees.indicators.map((indicator, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    indicator.risk === 'high' ? 'bg-red-500' :
                                    indicator.risk === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}></div>
                                  <span>{indicator.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Informações Institucionais para Políticos Locais */}
            {(politician.level === 'estadual' || politician.level === 'municipal') && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-6 h-6 text-blue-600" />
                  Informações Institucionais
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Informações da Instituição */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {politician.level === 'estadual' ? 'Assembleia Legislativa' : 'Câmara Municipal'}
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {politician.level === 'estadual' 
                            ? `Assembleia Legislativa do Estado de ${politician.state}`
                            : `Câmara Municipal de ${politician.municipality || 'Município'}`
                          }
                        </span>
                      </div>
                      
                      {politician.state_assembly_id && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Award className="w-4 h-4" />
                          <span>ID Assembleia: {politician.state_assembly_id}</span>
                        </div>
                      )}
                      
                      {politician.municipal_chamber_id && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Award className="w-4 h-4" />
                          <span>ID Câmara: {politician.municipal_chamber_id}</span>
                        </div>
                      )}
                      
                      {politician.electoral_zone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>Zona Eleitoral: {politician.electoral_zone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Status do Mandato */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800">Status do Mandato</h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          politician.current_mandate ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                        <span className="text-gray-700">
                          {politician.current_mandate ? 'Mandato Ativo' : 'Mandato Inativo'}
                        </span>
                      </div>
                      
                      {politician.mandate_start_date && (
                        <div className="text-sm text-gray-600">
                          <strong>Início:</strong> {formatDate(politician.mandate_start_date)}
                        </div>
                      )}
                      
                      {politician.mandate_end_date && (
                        <div className="text-sm text-gray-600">
                          <strong>Término:</strong> {formatDate(politician.mandate_end_date)}
                        </div>
                      )}
                      
                      {politician.source && (
                        <div className="text-sm text-gray-600">
                          <strong>Fonte:</strong> {politician.source.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Gastos e Transparência */}
            {(politician.position === 'Deputado Federal' || politician.position === 'deputado' || politician.position === 'Senador' || politician.position === 'senador' || politician.position === 'Deputado Estadual' || politician.position === 'Prefeito' || politician.position === 'Vereador') && politician.expenses_visible === true && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-green-600" />
                    Gastos e Transparência
                  </h2>
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      {[2025, 2024, 2023, 2022, 2021, 2020].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <button
                      onClick={refreshExpensesData}
                      className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                      title="Atualizar dados"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Resumo de Gastos */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Resumo de Gastos {selectedYear}
                    </h3>
                    
                    {(console.log('transparencyLoading:', transparencyLoading), transparencyLoading) ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                        <p className="text-gray-600 text-sm">Carregando gastos...</p>
                      </div>
                    ) : transparencyData?.expenses && transparencyData.expenses.total_year > 0 ? (
                      <div className="space-y-3">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-sm text-blue-600 font-medium">Total Gasto</div>
                          <div className="text-2xl font-bold text-blue-800">
                            {formatCurrency(transparencyData.expenses.total_year)}
                          </div>
                        </div>
                        
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-sm text-green-600 font-medium">Média Mensal</div>
                          <div className="text-xl font-bold text-green-800">
                            {formatCurrency(transparencyData.expenses.average_monthly)}
                          </div>
                        </div>

                        {transparencyData.expenses.categories && Object.keys(transparencyData.expenses.categories).length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-700">Principais Categorias:</div>
                            {Object.entries(transparencyData.expenses.categories).slice(0, 3).map(([nome, data], index) => (
                              <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                <span className="text-sm text-gray-700 truncate">{nome}</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {formatCurrency(data.total)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <PieChart className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Dados de gastos não disponíveis</p>
                      </div>
                    )}
                  </div>

                  {/* Informações de Salário */}
                  {transparencyData?.salary && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        Remuneração
                      </h3>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        {transparencyData.salary.base_salary && typeof transparencyData.salary.base_salary === 'number' && (
                          <div className="bg-green-50 p-4 rounded-lg">
                            <div className="text-sm text-green-600 font-medium">Salário Base</div>
                            <div className="text-xl font-bold text-green-800">
                              {formatCurrency(transparencyData.salary.base_salary)}
                            </div>
                          </div>
                        )}
                        
                        {transparencyData.salary.office_allowance && typeof transparencyData.salary.office_allowance === 'number' && (
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="text-sm text-blue-600 font-medium">Verba de Gabinete</div>
                            <div className="text-xl font-bold text-blue-800">
                              {formatCurrency(transparencyData.salary.office_allowance)}
                            </div>
                          </div>
                        )}
                        
                        {transparencyData.salary.total_monthly && typeof transparencyData.salary.total_monthly === 'number' && (
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="text-sm text-purple-600 font-medium">Total Mensal</div>
                            <div className="text-xl font-bold text-purple-800">
                              {formatCurrency(transparencyData.salary.total_monthly)}
                            </div>
                          </div>
                        )}
                        
                        {transparencyData.salary.allowances && Array.isArray(transparencyData.salary.allowances) && transparencyData.salary.allowances.length > 0 && (
                          <div className="bg-orange-50 p-4 rounded-lg">
                            <div className="text-sm text-orange-600 font-medium">Auxílios</div>
                            <div className="text-xs text-orange-700 space-y-1">
                              {transparencyData.salary.allowances.map((auxilio, index) => (
                                <div key={index} className="flex justify-between">
                                  <span>{auxilio.name}</span>
                                  <span className="font-medium">{formatCurrency(auxilio.value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {transparencyData.salary.source && (
                        <div className="text-xs text-gray-500 text-center">
                          Fonte: {transparencyData.salary.source}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Informações da Equipe */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      Equipe do Gabinete
                    </h3>
                    
                    {transparencyLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                        <p className="text-gray-600 text-sm">Carregando equipe...</p>
                      </div>
                    ) : transparencyData?.staff?.members && Array.isArray(transparencyData.staff.members) && transparencyData.staff.members.length > 0 ? (
                      <div className="space-y-3">
                        {/* Resumo da Equipe */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="text-sm text-purple-600 font-medium">Total de Servidores</div>
                            <div className="text-2xl font-bold text-purple-800">
                              {transparencyData.staff.members.length}
                            </div>
                          </div>
                          
                          {transparencyData?.staff?.salary_analysis && (
                            <div className="bg-green-50 p-4 rounded-lg">
                              <div className="text-sm text-green-600 font-medium">Folha de Pagamento</div>
                              <div className="text-2xl font-bold text-green-800">
                                {formatCurrency(transparencyData.staff.salary_analysis.total_payroll || 0)}
                              </div>
                              <div className="text-xs text-green-600 mt-1">
                                Mensal estimado
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Resumo de Gastos da Equipe */}
                        {transparencyData?.staff?.salary_analysis && (
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="text-sm text-blue-600 font-medium mb-2">Resumo de Gastos da Equipe</div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-gray-600">Gasto Anual Estimado</div>
                                <div className="font-bold text-blue-800">
                                  {formatCurrency((transparencyData.staff.salary_analysis.total_payroll || 0) * 12)}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-600">Média por Servidor</div>
                                <div className="font-bold text-blue-800">
                                  {formatCurrency((transparencyData.staff.salary_analysis.total_payroll || 0) / transparencyData.staff.members.length)}
                                </div>
                              </div>
                            </div>
                            {transparencyData.staff.salary_analysis.benefits_info && (
                              <div className="mt-2 text-xs text-blue-600">
                                💡 {transparencyData.staff.salary_analysis.benefits_info}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          <div className="text-sm font-medium text-gray-700">Equipe:</div>
                          {transparencyData.staff.members.slice(0, 5).map((servidor, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded border-l-4 border-purple-200">
                              <div className="font-medium text-gray-900 text-sm">
                                {servidor.nome || servidor.name || 'Nome não informado'}
                              </div>
                              <div className="text-xs text-gray-600 mb-1">
                                {servidor.cargo || servidor.position || 'Função não informada'}
                              </div>
                              
                              {/* Informações adicionais */}
                              <div className="space-y-1">
                                {(servidor.salario || servidor.salary) && (
                                  <div className="text-xs text-green-600 font-medium">
                                    💰 {formatCurrency(servidor.salario || servidor.salary)}
                                  </div>
                                )}
                                
                                {servidor.education && (
                                  <div className="text-xs text-blue-600">
                                    🎓 {servidor.education}
                                  </div>
                                )}
                                
                                {servidor.experience_years && (
                                  <div className="text-xs text-orange-600">
                                    📅 {servidor.experience_years} anos de experiência
                                  </div>
                                )}
                                
                                {servidor.location && (
                                  <div className="text-xs text-gray-500">
                                    📍 {servidor.location}
                                  </div>
                                )}
                                
                                {servidor.hire_date && (
                                  <div className="text-xs text-gray-500">
                                    📋 Contratado em: {new Date(servidor.hire_date).toLocaleDateString('pt-BR')}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {transparencyData.staff.members.length > 5 && (
                            <div className="text-center text-sm text-gray-500 py-2 bg-gray-100 rounded">
                              +{transparencyData.staff.members.length - 5} servidores adicionais
                              <div className="text-xs text-gray-400 mt-1">
                                Clique para ver todos os membros da equipe
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Dados da equipe não disponíveis</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Análise de Funcionários Fantasma */}
                {transparencyData?.staff?.ghost_employee_indicators && transparencyData.staff.ghost_employee_indicators.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      Análise de Funcionários Fantasma
                    </h3>
                    
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800">
                          {transparencyData.staff.ghost_employee_indicators.length} funcionário(s) com indicadores suspeitos
                        </span>
                      </div>
                      <p className="text-xs text-red-700">
                        Esta análise identifica possíveis irregularidades baseada em critérios como salários incompatíveis, 
                        nomes genéricos, CPF não informado e funcionários inativos recebendo salário.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      {transparencyData.staff.ghost_employee_indicators.map((indicator, index) => (
                        <div key={index} className={`p-4 rounded-lg border ${
                          indicator.risk_level === 'Alto' ? 'bg-red-50 border-red-200' :
                          indicator.risk_level === 'Médio' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-orange-50 border-orange-200'
                        }`}>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-medium text-gray-900">{indicator.name}</div>
                              <div className="text-sm text-gray-600">{indicator.cargo}</div>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              indicator.risk_level === 'Alto' ? 'bg-red-100 text-red-800' :
                              indicator.risk_level === 'Médio' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              Risco {indicator.risk_level}
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            {indicator.warnings.map((warning, wIndex) => (
                              <div key={wIndex} className="flex items-center gap-2 text-sm">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                <span className="text-gray-700">{warning}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Info className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Como interpretar</span>
                      </div>
                      <p className="text-xs text-blue-700">
                        Estes indicadores são baseados em análise automatizada e servem como alerta para possíveis 
                        irregularidades. Investigação adicional pode ser necessária para confirmar qualquer suspeita.
                      </p>
                    </div>
                  </div>
                )}
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
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {getRatingUserInitial(rating)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-gray-900">{getRatingUserName(rating)}</span>
                            <span className="text-sm text-gray-500">{formatDate(rating.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(rating.rating || 0)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            ))}
                          </div>
                          <p className="text-gray-700">{rating.comment}</p>
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
      {/* Modal de Sugestão */}
      {suggestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Enviar Sugestão</h3>
            <p className="text-sm text-gray-500 mb-4">
              Você pode enviar uma sugestão para este político uma vez por mês. 
              Sua sugestão será lida diretamente pela equipe do político.
            </p>
            <textarea
              value={suggestionText}
              onChange={(e) => setSuggestionText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 h-32 resize-none"
              placeholder="Digite sua sugestão aqui..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSuggestionModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={submittingSuggestion}
              >
                Cancelar
              </button>
              <button
                onClick={handleSuggestionSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                disabled={submittingSuggestion || !suggestionText.trim()}
              >
                {submittingSuggestion ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoliticianProfile;