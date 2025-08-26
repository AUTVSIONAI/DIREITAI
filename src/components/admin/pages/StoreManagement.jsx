import React, { useState, useEffect } from 'react'
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  Download, 
  Upload,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Star,
  Users,
  Calendar,
  BarChart3,
  Tag,
  Truck,
  CreditCard,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { storeManagementService } from '../../../services';

const StoreManagement = () => {
  const [selectedTab, setSelectedTab] = useState('products')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)

  // Estados para dados reais
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [storeStats, setStoreStats] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Estados para filtros
  const [productFilters, setProductFilters] = useState({
    search: '',
    category: 'all',
    status: 'all'
  })
  
  const [orderFilters, setOrderFilters] = useState({
    search: '',
    status: 'all',
    paymentStatus: 'all'
  })
  
  // Estados para modais e abas
  const [activeTab, setActiveTab] = useState('products')
  const [editingProduct, setEditingProduct] = useState(null)
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category: '',
    status: 'active',
    featured: false
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  
  // Estados para modal de categoria
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)

  // Função para carregar dados da API
  const loadData = async () => {
    try {
      setError(null)
      
      const productsData = await storeManagementService.getProducts()
      setProducts(productsData.products || [])
      
      const ordersData = await storeManagementService.getOrders()
      setOrders(ordersData.orders || [])
      
      const statsData = await storeManagementService.getStoreStats()
      setStoreStats(statsData)
      
      const categoriesData = await storeManagementService.getCategories()
      setCategories(categoriesData)
    } catch (err) {
      console.error('Erro ao carregar dados da loja:', err)
      setError('Erro ao carregar dados da loja')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Função para atualizar dados
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
  }

  // Funções para gerenciar produtos
  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      stock_quantity: product.stock_quantity?.toString() || '',
      category: product.category || '',
      status: product.status || 'active',
      featured: product.featured || false,
      warehouse_location: product.warehouse_location || 'Estoque Principal'
    })
    setImagePreview(product.image || null)
    setShowProductModal(true)
  }

  const handleDeleteProduct = async (product) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${product.name}"? Esta ação não pode ser desfeita.`)) {
      try {
        await storeManagementService.deleteProduct(product.id)
        await loadData() // Recarregar dados
        alert('Produto excluído com sucesso!')
      } catch (error) {
        console.error('Erro ao excluir produto:', error)
        alert('Erro ao excluir produto. Tente novamente.')
      }
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setImageFile(file)
        const reader = new FileReader()
        reader.onload = (e) => setImagePreview(e.target.result)
        reader.readAsDataURL(file)
      } else {
        alert('Por favor, selecione apenas arquivos de imagem (JPG, PNG, etc.)')
      }
    }
  }

  const uploadProductImage = async () => {
    if (!imageFile) return null
    
    try {
      setUploadingImage(true)
      const formData = new FormData()
      formData.append('image', imageFile)
      
      const response = await storeManagementService.uploadProductImage(formData)
      return response.data.imageUrl
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error)
      throw new Error('Falha no upload da imagem')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmitProduct = async (e) => {
    e.preventDefault()
    
    try {
      let imageUrl = null
      
      // Upload da imagem se houver uma nova
      if (imageFile) {
        imageUrl = await uploadProductImage()
      } else if (editingProduct && editingProduct.image) {
        // Manter a imagem existente se estiver editando e não houver nova imagem
        imageUrl = editingProduct.image
      } else if (imagePreview && !imageFile) {
        // Usar o preview se não houver arquivo mas houver preview (caso de edição)
        imageUrl = imagePreview
      }
      
      const productData = {
        ...productForm,
        price: parseFloat(productForm.price),
        stock_quantity: parseInt(productForm.stock_quantity),
        image: imageUrl
      }
      
      if (editingProduct) {
        await storeManagementService.updateProduct(editingProduct.id, productData)
        alert('Produto atualizado com sucesso!')
      } else {
        await storeManagementService.createProduct(productData)
        alert('Produto criado com sucesso!')
      }
      
      // Resetar formulário e fechar modal
      setShowProductModal(false)
      setEditingProduct(null)
      setProductForm({
        name: '',
        description: '',
        price: '',
        stock_quantity: '',
        category: '',
        status: 'active',
        featured: false,
        warehouse_location: 'Estoque Principal'
      })
      setImageFile(null)
      setImagePreview(null)
      
      // Recarregar dados
      await loadData()
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      alert('Erro ao salvar produto. Tente novamente.')
    }
  }

  const resetProductForm = () => {
    setEditingProduct(null)
    setProductForm({
      name: '',
      description: '',
      price: '',
      stock_quantity: '',
      category: '',
      status: 'active',
      featured: false,
      warehouse_location: 'Estoque Principal'
    })
    setImageFile(null)
    setImagePreview(null)
    setShowProductModal(false)
  }

  // Função para criar nova categoria
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Por favor, digite o nome da categoria')
      return
    }

    try {
      setCreatingCategory(true)
      const newCategory = await storeManagementService.createCategory(newCategoryName.trim())
      
      // Atualizar lista de categorias
      setCategories(prev => [...prev, newCategory])
      
      // Limpar formulário e fechar modal
      setNewCategoryName('')
      setShowCategoryModal(false)
      
      alert('Categoria criada com sucesso!')
    } catch (error) {
      console.error('Erro ao criar categoria:', error)
      if (error.response?.status === 409) {
        alert('Esta categoria já existe!')
      } else {
        alert('Erro ao criar categoria. Tente novamente.')
      }
    } finally {
      setCreatingCategory(false)
    }
  }

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadData()
  }, [])

  // Funções de filtragem
  const filteredProducts = Array.isArray(products) ? products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(productFilters.search.toLowerCase()) ||
                         product.description.toLowerCase().includes(productFilters.search.toLowerCase())
    const matchesCategory = productFilters.category === 'all' || product.category === productFilters.category
    const matchesStatus = productFilters.status === 'all' || product.status === productFilters.status
    
    return matchesSearch && matchesCategory && matchesStatus
  }) : []

  const filteredOrders = Array.isArray(orders) ? orders.filter(order => {
    const matchesSearch = order.id.toString().includes(orderFilters.search) ||
                         order.customer?.name?.toLowerCase().includes(orderFilters.search.toLowerCase()) ||
                         order.customer?.email?.toLowerCase().includes(orderFilters.search.toLowerCase())
    const matchesStatus = orderFilters.status === 'all' || order.status === orderFilters.status
    const matchesPaymentStatus = orderFilters.paymentStatus === 'all' || order.paymentStatus === orderFilters.paymentStatus
    
    return matchesSearch && matchesStatus && matchesPaymentStatus
  }) : []

  const getStatusColor = (status, type = 'product') => {
    if (type === 'product') {
      switch (status) {
        case 'active': return 'bg-green-100 text-green-800'
        case 'out_of_stock': return 'bg-red-100 text-red-800'
        case 'inactive': return 'bg-gray-100 text-gray-800'
        default: return 'bg-gray-100 text-gray-800'
      }
    } else {
      switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800'
        case 'processing': return 'bg-blue-100 text-blue-800'
        case 'shipped': return 'bg-purple-100 text-purple-800'
        case 'delivered': return 'bg-green-100 text-green-800'
        case 'cancelled': return 'bg-red-100 text-red-800'
        default: return 'bg-gray-100 text-gray-800'
      }
    }
  }

  const getStatusLabel = (status, type = 'product') => {
    if (type === 'product') {
      switch (status) {
        case 'active': return 'Ativo'
        case 'out_of_stock': return 'Sem Estoque'
        case 'inactive': return 'Inativo'
        default: return status
      }
    } else {
      switch (status) {
        case 'pending': return 'Pendente'
        case 'processing': return 'Processando'
        case 'shipped': return 'Enviado'
        case 'delivered': return 'Entregue'
        case 'cancelled': return 'Cancelado'
        default: return status
      }
    }
  }





  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-gray-600">Carregando dados da loja...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar dados</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadData}
            className="btn-primary"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciamento da Loja</h2>
          <p className="text-gray-600">Gerencie produtos, pedidos e vendas</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
          <button className="btn-secondary flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Exportar Dados
          </button>
          <button 
            onClick={() => setShowProductModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
              <p className="text-2xl font-bold text-gray-900">{storeStats?.totalProducts || 0}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Produtos Ativos</p>
              <p className="text-2xl font-bold text-green-600">{storeStats?.activeProducts || 0}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sem Estoque</p>
              <p className="text-2xl font-bold text-red-600">{storeStats?.outOfStock || 0}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900">R$ {(storeStats?.totalRevenue || 0).toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'products'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Produtos ({storeStats?.totalProducts || 0})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'orders'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pedidos ({storeStats?.totalOrders || 0})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Análises
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={activeTab === 'products' ? 'Buscar produtos...' : 'Buscar pedidos...'}
                value={activeTab === 'products' ? productFilters.search : orderFilters.search}
                onChange={(e) => {
                  if (activeTab === 'products') {
                    setProductFilters(prev => ({ ...prev, search: e.target.value }))
                  } else {
                    setOrderFilters(prev => ({ ...prev, search: e.target.value }))
                  }
                }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            {activeTab === 'products' && (
              <>
                <select
                  value={productFilters.category}
                  onChange={(e) => setProductFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">Todas as Categorias</option>
                  {Array.isArray(categories) && categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <select
                  value={productFilters.status}
                  onChange={(e) => setProductFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">Todos os Status</option>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="draft">Rascunho</option>
                </select>
              </>
            )}
            {activeTab === 'orders' && (
              <>
                <select
                  value={orderFilters.status}
                  onChange={(e) => setOrderFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">Todos os Status</option>
                  <option value="pending">Pendente</option>
                  <option value="processing">Processando</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregue</option>
                  <option value="cancelled">Cancelado</option>
                </select>
                <select
                  value={orderFilters.paymentStatus}
                  onChange={(e) => setOrderFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">Todos os Pagamentos</option>
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="failed">Falhou</option>
                  <option value="refunded">Reembolsado</option>
                </select>
              </>
            )}
          </div>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                <span className="ml-2 text-gray-600">Carregando produtos...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">{error}</p>
                <button 
                  onClick={loadData}
                  className="btn-primary"
                >
                  Tentar Novamente
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum produto encontrado</p>
              </div>
            ) : (
              filteredProducts.map(product => (
              <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                      {product.image && product.image !== 'https://example.com/camiseta.jpg' && product.image !== 'https://example.com/caneca.jpg' && product.image !== 'https://example.com/livro1.jpg' && product.image !== 'https://example.com/bone.jpg' ? (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <Package className="h-8 w-8 text-gray-400" style={{display: product.image && product.image !== 'https://example.com/camiseta.jpg' && product.image !== 'https://example.com/caneca.jpg' && product.image !== 'https://example.com/livro1.jpg' && product.image !== 'https://example.com/bone.jpg' ? 'none' : 'block'}} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                          {getStatusLabel(product.status)}
                        </span>
                        {product.featured && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Star className="h-3 w-3 mr-1" />
                            Destaque
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{product.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="font-semibold text-lg text-gray-900">R$ {product.price.toFixed(2)}</span>
                        <span>Estoque: {product.stock_quantity || 0}</span>
                        <span>Local: {product.warehouse_location || 'Estoque Principal'}</span>
                        <span>Categoria: {product.category}</span>
                        <span>Status: {product.active ? 'Ativo' : 'Inativo'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleEditProduct(product)}
                      className="p-2 text-blue-400 hover:text-blue-600" 
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product)}
                      className="p-2 text-red-400 hover:text-red-600" 
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                <span className="ml-2 text-gray-600">Carregando pedidos...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">{error}</p>
                <button 
                  onClick={loadData}
                  className="btn-primary"
                >
                  Tentar Novamente
                </button>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum pedido encontrado</p>
              </div>
            ) : (
              filteredOrders.map(order => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">Pedido {order.id}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status, 'order')}`}>
                        {getStatusLabel(order.status, 'order')}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {order.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{order.customer}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-semibold text-gray-900">R$ {order.total.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Itens:</span> {order.items.map(item => `${item.name} (${item.quantity}x)`).join(', ')}
                      </div>
                      
                      {order.trackingCode && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Código de rastreamento:</span> {order.trackingCode}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas por Categoria</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Roupas</span>
                    <span className="font-semibold">45%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '45%'}}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Livros</span>
                    <span className="font-semibold">30%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '30%'}}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Acessórios</span>
                    <span className="font-semibold">25%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{width: '25%'}}></div>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Produtos Mais Vendidos</h3>
                <div className="space-y-3">
                  {products.sort((a, b) => b.sold - a.sold).slice(0, 3).map((product, index) => (
                    <div key={product.id} className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.sold} vendidos</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas Gerais</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Ticket Médio</p>
                    <p className="text-2xl font-bold text-gray-900">R$ {(storeStats?.avgOrderValue || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Taxa de Conversão</p>
                    <p className="text-2xl font-bold text-green-600">3.2%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pedidos Pendentes</p>
                    <p className="text-2xl font-bold text-orange-600">{storeStats?.pendingOrders || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Detalhes do Produto</h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex space-x-4">
                <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-gray-900">{selectedProduct.name}</h4>
                  <p className="text-gray-600 mt-2">{selectedProduct.description}</p>
                  <div className="flex items-center space-x-4 mt-3">
                    <span className="text-2xl font-bold text-gray-900">R$ {selectedProduct.price.toFixed(2)}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedProduct.status)}`}>
                      {getStatusLabel(selectedProduct.status)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estoque</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedProduct.stock} unidades</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendidos</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedProduct.sold} unidades</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Avaliação</label>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-semibold">{selectedProduct.rating}</span>
                    <span className="text-gray-600">({selectedProduct.reviews} avaliações)</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Categoria</label>
                  <p className="text-lg font-semibold text-gray-900 capitalize">{selectedProduct.category}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedProduct(null)}
                className="btn-secondary"
              >
                Fechar
              </button>
              <button className="btn-secondary">
                Editar Produto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Detalhes do Pedido</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <h4 className="text-xl font-semibold text-gray-900">Pedido {selectedOrder.id}</h4>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status, 'order')}`}>
                  {getStatusLabel(selectedOrder.status, 'order')}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cliente</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedOrder.customer}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.customerEmail}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total</label>
                  <p className="text-lg font-semibold text-gray-900">R$ {selectedOrder.total.toFixed(2)}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Itens do Pedido</label>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">Quantidade: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-gray-900">R$ {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Endereço de Entrega</label>
                <p className="text-gray-900">{selectedOrder.shippingAddress}</p>
              </div>
              
              {selectedOrder.trackingCode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Código de Rastreamento</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedOrder.trackingCode}</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn-secondary"
              >
                Fechar
              </button>
              <button className="btn-primary">
                Atualizar Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button
                onClick={resetProductForm}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmitProduct} className="space-y-4">
              {/* Upload de Imagem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do Produto</label>
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="product-image"
                    />
                    <label
                      htmlFor="product-image"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {imagePreview ? 'Trocar Imagem' : 'Selecionar Imagem'}
                    </label>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF até 5MB</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Digite o nome do produto"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Descreva o produto"
                  required
                ></textarea>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
                  <input
                    type="number"
                    value={productForm.stock_quantity}
                    onChange={(e) => setProductForm(prev => ({ ...prev, stock_quantity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <div className="flex gap-2">
                    <select 
                      value={productForm.category}
                      onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">Selecione uma categoria</option>
                      {Array.isArray(categories) && categories.map(category => (
                        <option key={category.id || category} value={category.id || category}>
                          {category.name || category}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors flex items-center gap-1"
                      title="Adicionar nova categoria"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select 
                    value={productForm.status}
                    onChange={(e) => setProductForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="draft">Rascunho</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localização do Estoque</label>
                <input
                  type="text"
                  value={productForm.warehouse_location || ''}
                  onChange={(e) => setProductForm(prev => ({ ...prev, warehouse_location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ex: Estoque Principal, Depósito A, Prateleira 1-A"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  checked={productForm.featured}
                  onChange={(e) => setProductForm(prev => ({ ...prev, featured: e.target.checked }))}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">
                  Produto em destaque
                </label>
              </div>
            </form>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={resetProductForm}
                className="btn-secondary"
                type="button"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSubmitProduct}
                disabled={uploadingImage}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingImage && <Upload className="w-4 h-4 animate-spin" />}
                {uploadingImage ? 'Enviando...' : (editingProduct ? 'Atualizar Produto' : 'Criar Produto')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para criar categoria */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Nova Categoria</h3>
              <button
                onClick={() => {
                  setShowCategoryModal(false)
                  setNewCategoryName('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Digite o nome da categoria"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateCategory()
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCategoryModal(false)
                  setNewCategoryName('')
                }}
                className="btn-secondary"
                type="button"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreateCategory}
                disabled={creatingCategory || !newCategoryName.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingCategory && <Loader2 className="w-4 h-4 animate-spin" />}
                {creatingCategory ? 'Criando...' : 'Criar Categoria'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StoreManagement