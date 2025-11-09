import React, { useState, useEffect } from 'react'
import { ShoppingCart, Search, Star, Truck, Shield, Loader2, X, Link as LinkIcon, CheckCircle, ArrowLeft } from 'lucide-react'
import { apiClient } from '../../../lib/api'
import { StoreService } from '../../../services/store'
import { getMyAffiliateProfile, recordAffiliateClick } from '../../../services/affiliates'
import { useAuth } from '../../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const Store = () => {
  const navigate = useNavigate()
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
        const p = await getMyAffiliateProfile(userProfile.id)
        setAffiliateProfile(p)
      } catch (err) {
        console.warn('Falha ao carregar perfil de afiliado:', err)
        setAffiliateProfile(null)
      }
    }
    loadAffiliate()
  }, [userProfile?.id])

  // Flag: usuário é afiliado ativo
  const status = (affiliateProfile?.status || '').toLowerCase()
  const isAffiliateActive = !!(affiliateProfile?.code && (affiliateProfile?.is_active || status === 'active'))

  // Geração de link de afiliado por produto
  const copyAffiliateLink = async (product) => {
    if (!isAffiliateActive) return
    const link = `${window.location.origin}/store?aff=${affiliateProfile.code}&product=${encodeURIComponent(product.id)}`
    try {
      await navigator.clipboard.writeText(link)
      setCopiedProductId(product.id)
      setTimeout(() => setCopiedProductId(null), 1500)
      // Registrar evento de geração/cópia de link como clique do afiliado
      try {
        await recordAffiliateClick(affiliateProfile.code, '/store', userProfile?.id)
      } catch (err) {
        console.warn('Falha ao registrar clique de afiliado:', err)
      }
    } catch {}
  }

  // Carregar produtos e categorias da API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Carregar produtos
        const productsResponse = await apiClient.get('/store/products')
        const mappedProducts = productsResponse.data.products.map(mapApiProductToComponent)
        setProducts(mappedProducts)
        
        // Carregar categorias
        const categoriesResponse = await apiClient.get('/store/categories')
        const allCategories = [
          { id: 'all', name: 'Todas' },
          ...categoriesResponse.data.categories.map(cat => ({ id: cat, name: cat }))
        ]
        setCategories(allCategories)
        
      } catch (err) {
        console.error('Erro ao carregar dados da loja:', err)
        setError('Erro ao carregar produtos. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Função para mapear produtos da API para o formato esperado pelo componente
  const mapApiProductToComponent = (apiProduct) => {
    return {
      id: apiProduct.id,
      name: apiProduct.name,
      description: apiProduct.description,
      price: apiProduct.price,
      originalPrice: null,
      category: apiProduct.category,
      image: apiProduct.image || apiProduct.images?.[0] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop&crop=center',
      rating: apiProduct.rating || 0,
      reviews: apiProduct.reviews || 0,
      inStock: (apiProduct.stock_quantity || 0) > 0 && apiProduct.status === 'active',
      badge: apiProduct.featured ? 'Destaque' : null,
      stock: apiProduct.stock_quantity || 0,
      tags: apiProduct.tags || []
    }
  }

  // Filtrar produtos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Funções do carrinho
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(cart.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ))
    }
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const handleCheckout = async () => {
    try {
      const checkoutData = {
        items: cart.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        total: getTotalPrice()
      }
      
      const response = await StoreService.createCheckoutSession(checkoutData)
      if (response.url) {
        window.location.href = response.url
      }
    } catch (error) {
      console.error('Erro no checkout:', error)
      alert('Erro ao processar checkout. Tente novamente.')
    }
  }

  const getBadgeColor = (badge) => {
    switch (badge) {
      case 'Mais Vendido': return 'bg-green-100 text-green-800'
      case 'Promoção': return 'bg-red-100 text-red-800'
      case 'Novo': return 'bg-blue-100 text-blue-800'
      case 'Oferta': return 'bg-orange-100 text-orange-800'
      case 'Destaque': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              const ref = document.referrer
              try {
                if (ref) {
                  const u = new URL(ref)
                  if (u.origin === window.location.origin) {
                    navigate(u.pathname + u.search + u.hash, { replace: true })
                    return
                  }
                }
              } catch {}
              navigate('/dashboard', { replace: true })
            }}
            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Loja Patriota</h2>
            <p className="text-gray-600">Produtos exclusivos para conservadores</p>
          </div>
        </div>
        <button
          onClick={() => setShowCart(!showCart)}
          className="relative flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Carrinho</span>
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {cart.reduce((total, item) => total + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Banner para afiliados ativos */}
      {isAffiliateActive && (
        <div className="mt-4 p-3 border border-green-200 bg-green-50 text-green-800 rounded">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span>
              Você é um afiliado ativo. Gere links de produtos com o botão "Gerar link de afiliado" e compartilhe para acumular comissões.
            </span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
          <span className="ml-2 text-gray-600">Carregando produtos...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <X className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Search and Filters */}
      {!loading && !error && (
        <>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {categories.map(category => {
                const isActive = selectedCategory === category.id
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      isActive 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                  {product.badge && (
                    <span className={`absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded-full ${
                      getBadgeColor(product.badge)
                    }`}>
                      {product.badge}
                    </span>
                  )}
                  {isAffiliateActive && (
                    <span className="absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" /> Afiliado
                    </span>
                  )}
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white font-medium">Esgotado</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                  {isAffiliateActive && (
                    <div className="flex items-center mb-3">
                      <button
                        onClick={() => copyAffiliateLink(product)}
                        className="px-3 py-1 border border-green-600 text-green-700 text-xs rounded hover:bg-green-50 flex items-center"
                      >
                        <LinkIcon className="h-3 w-3 mr-1" /> {copiedProductId === product.id ? 'Link copiado!' : 'Gerar link de afiliado'}
                      </button>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-primary-600">
                        R$ {product.price.toFixed(2).replace('.', ',')}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={!product.inStock}
                      className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Adicionar ao Carrinho
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum produto encontrado.</p>
            </div>
          )}

          {/* Cart Sidebar */}
          {showCart && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
              <div className="bg-white w-full max-w-md h-full overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Carrinho de Compras</h3>
                    <button
                      onClick={() => setShowCart(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  {cart.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Seu carrinho está vazio</p>
                  ) : (
                    <>
                      <div className="space-y-4 mb-6">
                        {cart.map(item => (
                          <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                            <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                            <div className="flex-1">
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-primary-600">R$ {item.price.toFixed(2).replace('.', ',')}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="w-8 h-8 flex items-center justify-center border rounded"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="w-8 h-8 flex items-center justify-center border rounded"
                                >
                                  +
                                </button>
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="ml-2 text-red-500 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-lg font-semibold">Total:</span>
                          <span className="text-lg font-bold text-primary-600">
                            R$ {getTotalPrice().toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        <button
                          onClick={handleCheckout}
                          className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 font-medium"
                        >
                          Finalizar Compra
                        </button>
                        <div className="text-xs text-gray-500 space-y-1 mt-4">
                          <div className="flex items-center space-x-1">
                            <Truck className="h-3 w-3" />
                            <span>Frete grátis acima de R$ 100</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Shield className="h-3 w-3" />
                            <span>Compra 100% segura</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Store