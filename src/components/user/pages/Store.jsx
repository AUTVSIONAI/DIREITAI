import React, { useState, useEffect } from 'react'
import { ShoppingCart, Search, Star, Truck, Shield, Loader2, X, Link as LinkIcon, CheckCircle, ArrowLeft, ShoppingBag } from 'lucide-react'
import { apiClient } from '../../../lib/api'
import { StoreService } from '../../../services/store'
import { getMyAffiliateProfile, recordAffiliateClick } from '../../../services/affiliates'
import { useAuth } from '../../../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import SEO from '../../common/SEO'

const Store = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [copiedProductId, setCopiedProductId] = useState(null)
  const { userProfile } = useAuth()
  const [affiliateProfile, setAffiliateProfile] = useState(null)

  // Carregar perfil de afiliado do usuário
  useEffect(() => {
    const loadAffiliate = async () => {
      if (!userProfile?.id) {
        setAffiliateProfile(null)
        return
      }
      try {
        const profile = await getMyAffiliateProfile()
        setAffiliateProfile(profile)
      } catch (err) {
        console.error('Erro ao carregar perfil de afiliado:', err)
        // Não mostrar erro para usuário comum, apenas logar
      }
    }
    loadAffiliate()
  }, [userProfile])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [productsData, categoriesData] = await Promise.all([
              StoreService.getProducts(),
              StoreService.getCategories()
            ])
            // productsData returns { products: [], total: 0, ... }
            setProducts(productsData.products || []) 
            setCategories([{ id: 'all', name: 'Todos' }, ...categoriesData])
          } catch (err) {
      setError('Erro ao carregar produtos. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
    setShowCart(true)
  }

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return
    setCart(prev =>
      prev.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    )
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const handleCheckout = async () => {
    try {
      setProcessingCheckout(true)
      const response = await StoreService.createProductCheckout(cart)
      
      if (response && response.url) {
        window.location.href = response.url
      } else {
        alert('Erro ao iniciar checkout. Tente novamente.')
      }
    } catch (err) {
      console.error('Erro no checkout:', err)
      alert('Não foi possível processar o pagamento. ' + (err.response?.data?.error || err.message))
    } finally {
      setProcessingCheckout(false)
    }
  }

  const isAffiliateActive = affiliateProfile?.status === 'active'

  // SEO Logic for Shared Product
  const searchParams = new URLSearchParams(location.search);
  const sharedProductId = searchParams.get('product');
  const sharedProduct = products.find(p => p.id === sharedProductId);

  const getCommissionValue = (product) => {
    if (!product.affiliate_enabled) return 0
    const rate = product.affiliate_rate_percent || 0
    return (product.price * rate) / 100
  }

  const copyAffiliateLink = async (product) => {
    console.log('Tentando copiar link...', { isAffiliateActive, affiliateProfile, product })
    
    // Check for code property (it might be 'code' or 'referral_code' depending on backend version)
    const affiliateCode = affiliateProfile?.code || affiliateProfile?.referral_code

    if (!isAffiliateActive || !affiliateCode) {
      console.warn('Afiliado não ativo ou sem código', affiliateProfile)
      alert('Erro: Seu perfil de afiliado parece incompleto. Contate o suporte.')
      return
    }
    
    // Gerar link com ref code
    // Usar window.location.origin para pegar o domínio atual
    const link = `${window.location.origin}/store?ref=${affiliateCode}&product=${product.id}`
    
    try {
      await navigator.clipboard.writeText(link)
      setCopiedProductId(product.id)
      setTimeout(() => setCopiedProductId(null), 2000)
    } catch (err) {
      console.error('Falha ao copiar', err)
      // Fallback para input manual se clipboard falhar
      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedProductId(product.id)
        setTimeout(() => setCopiedProductId(null), 2000)
      } catch (err2) {
        console.error('Fallback falhou', err2)
        alert('Não foi possível copiar o link automaticamente. O link é: ' + link)
      }
      document.body.removeChild(textArea);
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getBadgeColor = (badge) => {
    switch (badge?.toLowerCase()) {
      case 'novo': return 'bg-blue-100 text-blue-800'
      case 'oferta': return 'bg-red-100 text-red-800'
      case 'popular': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <SEO 
        title={sharedProduct ? sharedProduct.name : 'Loja Patriota - DireitaAI'}
        description={sharedProduct ? sharedProduct.description : 'Produtos exclusivos para quem ama o Brasil. Vista a camisa e mostre seu orgulho.'}
        image={sharedProduct ? sharedProduct.image_url : undefined}
        type={sharedProduct ? 'product' : 'website'}
      />
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-16 px-4 sm:px-6 lg:px-8 mb-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-8 md:mb-0 md:w-1/2">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                Loja Patriota
              </h1>
              <p className="text-xl text-blue-100 mb-8 max-w-lg">
                Produtos exclusivos para quem ama o Brasil. Vista a camisa e mostre seu orgulho.
              </p>
              <div className="flex space-x-4">
                <button 
                  onClick={() => document.getElementById('products-grid').scrollIntoView({ behavior: 'smooth' })}
                  className="bg-white text-blue-900 px-6 py-3 rounded-full font-bold shadow-md hover:bg-blue-50 transition-all transform hover:scale-105"
                >
                  Ver Produtos
                </button>
                {isAffiliateActive && (
                  <div className="flex items-center bg-blue-800/50 px-4 py-2 rounded-full border border-blue-400/30">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    <span className="text-sm font-medium">Modo Afiliado Ativo</span>
                  </div>
                )}
              </div>
            </div>
            <div className="hidden md:block md:w-1/3">
              <div className="aspect-w-1 aspect-h-1 bg-white/10 rounded-2xl backdrop-blur-sm p-8 flex items-center justify-center border border-white/20">
                <ShoppingBag className="h-32 w-32 text-white/80" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors self-start md:self-auto"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Voltar ao Dashboard</span>
          </button>

          <button
            onClick={() => setShowCart(!showCart)}
            className="relative flex items-center space-x-2 px-6 py-3 bg-white text-gray-800 rounded-full shadow-md hover:shadow-lg transition-all border border-gray-100 group"
          >
            <ShoppingCart className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
            <span className="font-bold">Carrinho</span>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white">
                {cart.reduce((total, item) => total + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>

        {/* Affiliate Banner */}
        {isAffiliateActive && (
          <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-sm flex items-start sm:items-center gap-4">
            <div className="bg-green-100 p-2 rounded-full shrink-0">
              <Star className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-green-800">Painel de Afiliado</h3>
              <p className="text-green-700 text-sm mt-1">
                Você ganha comissões por vendas! Use o botão <span className="font-semibold bg-white px-2 py-0.5 rounded border border-green-200 mx-1 text-xs uppercase">Gerar Link</span> nos produtos para compartilhar.
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
            <span className="text-lg text-gray-600 font-medium">Carregando a melhor loja do Brasil...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-2xl mx-auto">
            <X className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-800 mb-2">Ops! Algo deu errado</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-100 text-red-700 px-6 py-2 rounded-full font-medium hover:bg-red-200 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && (
          <div className="flex flex-col lg:flex-row gap-8" id="products-grid">
            {/* Sidebar Filters */}
            <div className="w-full lg:w-64 shrink-0 space-y-6">
              {/* Search */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Search className="h-4 w-4 text-blue-500" />
                  Buscar
                </h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="O que você procura?"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Categories */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Categorias</h3>
                <div className="space-y-2">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between ${
                        selectedCategory === category.id
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span>{category.name}</span>
                      {selectedCategory === category.id && <CheckCircle className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Banner Promo Sidebar */}
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-6 text-white shadow-md">
                <h3 className="font-bold text-lg mb-2">Frete Grátis</h3>
                <p className="text-white/90 text-sm mb-4">Em compras acima de R$ 299,00 para todo o Brasil.</p>
                <div className="bg-white/20 p-2 rounded-lg inline-flex">
                  <Truck className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <div key={product.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group flex flex-col">
                    {/* Image Area */}
                    <div className="relative aspect-w-1 aspect-h-1 bg-gray-100 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                      />
                      {product.badge && (
                        <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getBadgeColor(product.badge)}`}>
                          {product.badge}
                        </span>
                      )}
                      
                      {/* Quick Actions Overlay */}
                      <div className={`absolute inset-0 bg-black/10 flex items-center justify-center gap-3 transition-opacity duration-300 ${isAffiliateActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                         {isAffiliateActive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              copyAffiliateLink(product)
                            }}
                            className="bg-white text-gray-900 px-4 py-2 rounded-full hover:bg-green-600 hover:text-white transition-all shadow-lg flex items-center gap-2 font-medium transform hover:scale-105 active:scale-95"
                            title="Copiar Link de Afiliado"
                          >
                            {copiedProductId === product.id ? (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                <span>Copiado!</span>
                              </>
                            ) : (
                              <>
                                <LinkIcon className="h-4 w-4" />
                                <span>Link de Afiliado</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{product.category}</span>
                        <div className="flex items-center text-yellow-400 text-xs">
                          <Star className="h-3 w-3 fill-current" />
                          <span className="ml-1 text-gray-600 font-medium">{product.rating}</span>
                        </div>
                      </div>

                      <h3 className="font-bold text-gray-900 text-lg mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">
                        {product.description}
                      </p>

                      {isAffiliateActive && product.affiliate_enabled && (
                        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-2 flex items-center justify-between">
                          <span className="text-xs text-green-700 font-medium uppercase">Sua Comissão</span>
                          <span className="text-sm font-bold text-green-700">
                            R$ {getCommissionValue(product).toFixed(2)}
                          </span>
                        </div>
                      )}

                      <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex flex-col">
                          {product.originalPrice && (
                            <span className="text-xs text-gray-400 line-through">
                              R$ {product.originalPrice.toFixed(2)}
                            </span>
                          )}
                          <span className="text-xl font-bold text-blue-700">
                            R$ {product.price.toFixed(2)}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => addToCart(product)}
                          disabled={!product.inStock}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm flex items-center gap-2 ${
                            product.inStock
                              ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-95'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {product.inStock ? (
                            <>
                              <ShoppingCart className="h-4 w-4" />
                              Comprar
                            </>
                          ) : (
                            'Esgotado'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Nenhum produto encontrado</h3>
                  <p className="text-gray-500 max-w-xs mx-auto">
                    Tente buscar por outro termo ou selecione outra categoria.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedCategory('all')
                    }}
                    className="mt-6 text-blue-600 font-medium hover:underline"
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cart Drawer (Overlay) */}
      {showCart && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setShowCart(false)} />
          <div className="absolute inset-y-0 right-0 max-w-md w-full flex">
            <div className="w-full bg-white shadow-2xl flex flex-col h-full transform transition-transform duration-300">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  Seu Carrinho
                </h2>
                <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="h-10 w-10 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">Seu carrinho está vazio.</p>
                    <button 
                      onClick={() => setShowCart(false)}
                      className="mt-4 text-blue-600 font-medium hover:underline"
                    >
                      Continuar comprando
                    </button>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 line-clamp-1">{item.name}</h4>
                        <p className="text-blue-600 font-bold mt-1">R$ {item.price.toFixed(2)}</p>
                        <div className="flex items-center mt-2 gap-3">
                          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-2 py-1 text-gray-600 hover:text-blue-600 hover:bg-white rounded-l-lg transition-colors"
                            >
                              -
                            </button>
                            <span className="px-2 text-sm font-medium w-8 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-2 py-1 text-gray-600 hover:text-blue-600 hover:bg-white rounded-r-lg transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-400 hover:text-red-600 text-sm hover:underline"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-gray-100 bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600 font-medium">Total</span>
                    <span className="text-2xl font-bold text-blue-700">R$ {getTotalPrice().toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <Shield className="h-5 w-5" />
                    Finalizar Compra Segura
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                    <Shield className="h-3 w-3" />
                    Pagamento 100% seguro e criptografado
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Store
