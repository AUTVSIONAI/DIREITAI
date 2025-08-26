import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, User, Eye, Tag, Share2, Facebook, Twitter, Linkedin, 
  MessageCircle, Heart, ExternalLink, Send, ThumbsUp, TrendingUp, Clock
} from 'lucide-react';
import { apiClient } from '../lib/api';

// Função para processar URLs de imagens no conteúdo HTML
const processImageUrls = (content) => {
  if (!content) return content;
  
  // Processar imagens com URLs relativas
  let processedContent = content
    // URLs que começam com /uploads/ -> usar a URL base da API
    .replace(/src="\/uploads\//g, 'src="https://direitai-backend.vercel.app/uploads/')
    // URLs que começam com ./assets/ -> usar a URL do frontend
    .replace(/src="\.\/assets\//g, 'src="http://localhost:5120/assets/')
    // URLs que começam com /assets/ -> usar a URL do frontend
    .replace(/src="\/assets\//g, 'src="http://localhost:5120/assets/')
    // URLs que começam com ./images/ -> usar a URL do frontend
    .replace(/src="\.\/images\//g, 'src="http://localhost:5120/images/')
    // URLs que começam com /images/ -> usar a URL do frontend
    .replace(/src="\/images\//g, 'src="http://localhost:5120/images/');
  
  return processedContent;
};

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [sharesCount, setSharesCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [relatedPosts, setRelatedPosts] = useState([]);

  useEffect(() => {
    fetchPost();
    fetchRelatedPosts();
  }, [slug]);

  useEffect(() => {
    if (post?.id) {
      registerView();
      checkLikeStatus();
      fetchComments();
    }
  }, [post?.id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/blog/posts/${slug}`);
      
      const data = response.data;
      console.log('📝 Dados do post carregados:', data);
      console.log('🖼️ URL da imagem:', data.cover_image_url || data.featured_image_url);
      setPost(data);
      setLikesCount(data.likes_count || 0);
      setCommentsCount(data.comments_count || 0);
      setSharesCount(data.shares_count || 0);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPosts = async () => {
    try {
      const response = await apiClient.get('/blog/posts?limit=4');
      const data = response.data;
      setRelatedPosts(data.posts || []);
    } catch (err) {
      console.error('Erro ao buscar posts relacionados:', err);
    }
  };

  const registerView = async () => {
    if (!post?.id) return;
    try {
      await apiClient.post(`/blog/${post.id}/view`, {
        ip: null // O backend usará req.ip
      });
    } catch (error) {
      console.error('Erro ao registrar visualização:', error);
    }
  };

  const checkLikeStatus = async () => {
    if (!post?.id) return;
    try {
      const response = await apiClient.get(`/blog/${post.id}/like-status`);
      setIsLiked(response.data.liked);
    } catch (error) {
      console.error('Erro ao verificar status de curtida:', error);
    }
  };

  const fetchComments = async () => {
    if (!post?.id) return;
    try {
      const response = await apiClient.get(`/blog/${post.id}/comments`);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      // Manter comentários simulados como fallback
      setComments([
        {
          id: 1,
          content: 'Excelente análise! Muito esclarecedor.',
          created_at: new Date().toISOString(),
          likes_count: 5,
          users: { name: 'João Silva' }
        },
        {
          id: 2,
          content: 'Concordo plenamente com os pontos levantados.',
          created_at: new Date().toISOString(),
          likes_count: 3,
          users: { name: 'Maria Santos' }
        }
      ]);
    }
  };

  const handleLike = async () => {
    try {
      const response = await apiClient.post(`/blog/${post.id}/like`);
      setIsLiked(response.data.liked);
      setLikesCount(prev => response.data.liked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Erro ao curtir post:', error);
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      try {
        const response = await apiClient.post(`/blog/${post.id}/comments`, {
          content: newComment
        });
        setComments([response.data, ...comments]);
        setCommentsCount(prev => prev + 1);
        setNewComment('');
      } catch (error) {
        console.error('Erro ao adicionar comentário:', error);
        alert('Erro ao adicionar comentário. Verifique se você está logado.');
      }
    }
  };

  const sharePost = (platform) => {
    const url = window.location.href;
    const title = post?.title || '';
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`);
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        alert('Link copiado!');
        break;
    }
    setShowShareMenu(false);
    setSharesCount(prev => prev + 1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatFullDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando post...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Post não encontrado</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/blog')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar ao Blog
          </button>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Moderno */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="text-2xl font-bold text-blue-600">
                DireitAI
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link to="/blog" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  Notícias
                </Link>
                <Link to="/politicians" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  Políticos
                </Link>
                <Link to="/surveys" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  Pesquisas
                </Link>
              </nav>
            </div>
            <button
              onClick={() => navigate('/blog')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link to="/" className="hover:text-blue-600 transition-colors">Início</Link>
          <span>›</span>
          <Link to="/blog" className="hover:text-blue-600 transition-colors">Notícias</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium truncate">{post.title}</span>
        </nav>

        {/* Artigo Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Conteúdo Principal */}
          <article className="lg:col-span-3">
            {/* Imagem de Destaque */}
            {(post.cover_image_url || post.featured_image_url) && (
              <div className="relative h-64 md:h-96 overflow-hidden rounded-xl shadow-lg mb-8">
                <img
                  src={`http://localhost:5120${post.cover_image_url || post.featured_image_url}`}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.log('❌ Erro ao carregar imagem:', e.target.src);
                    e.target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              {/* Tags */}
              {post.politician_tags && post.politician_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.politician_tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      <Tag className="w-3 h-3" />
                      {tag.tag_name}
                    </span>
                  ))}
                </div>
              )}

              {/* Título Principal */}
              <header className="mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight font-serif">
                  {post.title}
                </h1>
                
                {/* Subtítulo/Resumo se existir */}
                {post.excerpt && (
                  <p className="text-xl text-gray-600 leading-relaxed font-light">
                    {post.excerpt}
                  </p>
                )}
              </header>

              {/* Meta Info Profissional */}
              <div className="flex flex-wrap items-center justify-between gap-4 py-6 mb-8 border-y border-gray-200">
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  {/* Autor */}
                  <div className="flex items-center gap-3">
                    {post.politicians?.photo_url ? (
                      <img
                        src={post.politicians.photo_url}
                        alt={post.politicians.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">
                        Por {post.politicians?.name || 'Redação DireitAI'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {post.politicians?.position || 'Jornalista'}
                      </div>
                    </div>
                  </div>

                  {/* Data */}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span title={formatFullDate(post.published_at || post.created_at)}>
                      {formatDate(post.published_at || post.created_at)}
                    </span>
                  </div>

                  {/* Visualizações */}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Eye className="w-4 h-4" />
                    <span>{(post.views || 0).toLocaleString()} visualizações</span>
                  </div>
                </div>
                
                {/* Tempo de leitura estimado */}
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                  <Clock className="w-4 h-4" />
                  <span>{Math.max(1, Math.ceil((post.content?.length || 0) / 1000))} min de leitura</span>
                </div>
              </div>

              {/* Contadores Sociais Modernos */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <div className="flex flex-wrap items-center gap-6">
                  {/* Curtidas */}
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 transform hover:scale-105 ${
                      isLiked 
                        ? 'bg-red-500 text-white shadow-lg shadow-red-200' 
                        : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500 border border-gray-200'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    <span className="font-medium">{likesCount}</span>
                  </button>

                  {/* Comentários */}
                  <button
                    onClick={toggleComments}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-500 border border-gray-200 transition-all duration-300 transform hover:scale-105"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium">{commentsCount}</span>
                  </button>

                  {/* Compartilhamentos */}
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-gray-600 border border-gray-200">
                    <Share2 className="w-5 h-5" />
                    <span className="font-medium">{sharesCount}</span>
                  </div>

                  {/* Visualizações */}
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-gray-600 border border-gray-200">
                    <Eye className="w-5 h-5" />
                    <span className="font-medium">{post.views || 0}</span>
                  </div>
                </div>

                {/* Trending Badge */}
                {(likesCount > 10 || commentsCount > 5) && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-full text-sm font-medium">
                    <TrendingUp className="w-4 h-4" />
                    <span>Trending</span>
                  </div>
                )}
              </div>

              {/* Compartilhar */}
              <div className="relative mb-8">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Compartilhar
                </button>

                {showShareMenu && (
                  <div className="absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                    <button
                      onClick={() => sharePost('facebook')}
                      className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <Facebook className="w-4 h-4 text-blue-600" />
                      Facebook
                    </button>
                    <button
                      onClick={() => sharePost('twitter')}
                      className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <Twitter className="w-4 h-4 text-blue-400" />
                      Twitter
                    </button>
                    <button
                      onClick={() => sharePost('linkedin')}
                      className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <Linkedin className="w-4 h-4 text-blue-700" />
                      LinkedIn
                    </button>
                    <button
                      onClick={() => sharePost('whatsapp')}
                      className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      WhatsApp
                    </button>
                    <button
                      onClick={() => sharePost('copy')}
                      className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 transition-colors border-t border-gray-200"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-600" />
                      Copiar Link
                    </button>
                  </div>
                )}
              </div>

              {/* Conteúdo */}
              <div 
                className="prose prose-lg prose-blue max-w-none"
                dangerouslySetInnerHTML={{ __html: processImageUrls(post.content) }}
              />
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-8 space-y-8">
              {/* Posts Relacionados */}
              {relatedPosts.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Mais Notícias
                  </h3>
                  <div className="space-y-4">
                    {relatedPosts.slice(0, 4).map((relatedPost) => (
                      <Link
                        key={relatedPost.id}
                        to={`/blog/${relatedPost.slug}`}
                        className="block group hover:bg-gray-50 p-3 rounded-lg transition-colors"
                      >
                        <div className="flex gap-3">
                          {relatedPost.cover_image_url && (
                            <img
                              src={relatedPost.cover_image_url}
                              alt={relatedPost.title}
                              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2 text-sm mb-1">
                              {relatedPost.title}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {formatDate(relatedPost.published_at || relatedPost.created_at)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Newsletter */}
              <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl p-6 text-white">
                <h3 className="text-xl font-bold mb-3">📧 Newsletter</h3>
                <p className="text-blue-100 mb-4 text-sm">
                  Receba as principais notícias políticas direto no seu email.
                </p>
                <form className="space-y-3">
                  <input
                    type="email"
                    placeholder="Seu melhor email"
                    className="w-full px-3 py-2 rounded-lg text-gray-900 text-sm"
                  />
                  <button
                    type="submit"
                    className="w-full bg-white text-blue-600 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm"
                  >
                    Inscrever-se
                  </button>
                </form>
              </div>

              {/* Tags Populares */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  🏷️ Tags Populares
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['Política', 'Eleições', 'Congresso', 'STF', 'Economia', 'Saúde', 'Educação', 'Segurança'].map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-800 text-sm rounded-full cursor-pointer transition-colors"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Seção de Comentários */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            {showComments && (
              <div className="mt-12 border-t border-gray-200 pt-8">
                <div className="flex items-center gap-3 mb-6">
                  <MessageCircle className="w-6 h-6 text-blue-500" />
                  <h3 className="text-2xl font-bold text-gray-900">
                    Comentários ({commentsCount})
                  </h3>
                </div>

                {/* Formulário para Adicionar Comentário */}
                <form onSubmit={handleAddComment} className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      U
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Compartilhe sua opinião sobre este post..."
                        className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                      />
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-sm text-gray-500">
                          {newComment.length}/500 caracteres
                        </span>
                        <button
                          type="submit"
                          disabled={!newComment.trim()}
                          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Send className="w-4 h-4" />
                          Comentar
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                {/* Lista de Comentários */}
                <div className="space-y-6">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {(comment.users?.name || comment.author || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-gray-900">{comment.users?.name || comment.author || 'Usuário'}</span>
                            <span className="text-sm text-gray-500">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-3">{comment.content}</p>
                          <div className="flex items-center gap-4">
                            <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors">
                              <ThumbsUp className="w-4 h-4" />
                              {comment.likes_count || comment.likes || 0}
                            </button>
                            <button className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                              Responder
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        Nenhum comentário ainda
                      </h4>
                      <p className="text-gray-500">
                        Seja o primeiro a comentar sobre este post!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Informações do Político */}
            {post.politicians && (
              <div className="mt-12 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Sobre {post.politicians.name}
                </h3>
                <div className="flex flex-col md:flex-row gap-4">
                  {post.politicians.photo_url && (
                    <img
                      src={post.politicians.photo_url}
                      alt={post.politicians.name}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-gray-700 mb-4">
                      {post.politicians.bio || 'Informações sobre o político em breve.'}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {post.politicians.position && (
                        <span>📍 {post.politicians.position}</span>
                      )}
                      {post.politicians.party && (
                        <span>🏛️ {post.politicians.party}</span>
                      )}
                    </div>
                    <Link
                      to={`/politicians/${post.politicians.id}`}
                      className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Ver perfil completo
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;