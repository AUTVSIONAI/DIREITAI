import { apiClient } from "../lib/api";
import axios from 'axios'

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  sold: number;
  rating: number;
  reviews: number;
  image: string;
  status: 'active' | 'inactive' | 'out_of_stock';
  createdAt: string;
  featured: boolean;
}

export interface Order {
  id: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  items: {
    productId: number;
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  trackingCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreStats {
  totalProducts: number;
  activeProducts: number;
  outOfStock: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageOrderValue: number;
  topSellingProducts: {
    id: number;
    name: string;
    sold: number;
    revenue: number;
  }[];
}

export interface ProductFilters {
  category?: string;
  status?: string;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface OrderFilters {
  status?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

class StoreManagementService {
  // Products
  async getProducts(filters?: ProductFilters, page = 1, limit = 20): Promise<{
    products: Product[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.category && { category: filters.category }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.featured !== undefined && { featured: filters.featured.toString() }),
      ...(filters?.minPrice && { minPrice: filters.minPrice.toString() }),
      ...(filters?.maxPrice && { maxPrice: filters.maxPrice.toString() }),
      ...(filters?.search && { search: filters.search })
    });

    try {
      const response = await apiClient.get(`/admin/store/products?${params}`);
      const data = response.data as any;
      const products = data?.products || data?.data?.products || data?.data || [];
      const total = data?.total || data?.data?.total || (Array.isArray(products) ? products.length : 0);
      const totalPages = data?.totalPages || data?.data?.totalPages || 1;
      const pageNum = data?.page || data?.data?.page || page;
      return { products, total, page: pageNum, totalPages };
    } catch (err: any) {
      // Fallback para endpoint público caso o admin falhe
      const fallback = await apiClient.get(`/store/products?${params}`);
      const fdata = fallback.data as any;
      const products = fdata?.products || fdata?.data?.products || fdata?.data || [];
      const total = fdata?.total || fdata?.data?.total || (Array.isArray(products) ? products.length : 0);
      const totalPages = fdata?.totalPages || fdata?.data?.totalPages || 1;
      const pageNum = fdata?.page || fdata?.data?.page || page;
      return { products, total, page: pageNum, totalPages };
    }
  }

  async getProduct(id: number): Promise<Product> {
    const response = await apiClient.get(`/admin/store/products/${id}`);
    return response.data;
  }

  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'sold' | 'rating' | 'reviews'>): Promise<Product> {
    const response = await apiClient.post('/admin/store/products', product);
    const status = (response as any)?.status || 200;
    const success = (response as any)?.success ?? (status < 400);
    const payload: any = response.data;
    if (!success) {
      const msg = payload?.error || payload?.message || 'Falha ao criar produto';
      throw new Error(msg);
    }
    return payload?.product || payload?.data || payload;
  }

  async updateProduct(id: number, product: Partial<Product>): Promise<Product> {
    const response = await apiClient.put(`/admin/store/products/${id}`, product);
    const status = (response as any)?.status || 200;
    const success = (response as any)?.success ?? (status < 400);
    const payload: any = response.data;
    if (!success) {
      const msg = payload?.error || payload?.message || 'Falha ao atualizar produto';
      throw new Error(msg);
    }
    return payload?.product || payload?.data || payload;
  }

  async deleteProduct(id: number): Promise<void> {
    await apiClient.delete(`/admin/store/products/${id}`);
  }

  async updateProductStock(id: number, stock: number): Promise<Product> {
    const response = await apiClient.patch(`/admin/store/products/${id}/stock`, { stock });
    return response.data;
  }

  async toggleProductFeatured(id: number): Promise<Product> {
    const response = await apiClient.patch(`/admin/store/products/${id}/featured`);
    return response.data;
  }

  async uploadProductImage(formData: FormData): Promise<{ data: { imageUrl: string } }> {
    const response = await apiClient.post('/store/upload/image', formData, {
      onUploadProgress: undefined,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const payload: any = response.data
    const url = payload?.data?.url || payload?.url || payload?.data?.imageUrl || payload?.imageUrl || ''
    return { data: { imageUrl: url } }
  }
  async uploadProductFile(formData: FormData) {
    const response = await apiClient.post('/store/upload/file', formData, {
      onUploadProgress: undefined,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const payload: any = response.data
    const url = payload?.data?.url || payload?.url || payload?.data?.fileUrl || payload?.fileUrl || ''
    return { data: { fileUrl: url } }
  }
  // Orders
  async getOrders(filters?: OrderFilters, page = 1, limit = 20): Promise<{
    orders: Order[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.paymentStatus && { paymentStatus: filters.paymentStatus }),
      ...(filters?.dateFrom && { dateFrom: filters.dateFrom }),
      ...(filters?.dateTo && { dateTo: filters.dateTo }),
      ...(filters?.search && { search: filters.search })
    });

    const response = await apiClient.get(`/admin/store/orders?${params}`);
    return response.data;
  }

  async getOrder(id: string): Promise<Order> {
    const response = await apiClient.get(`/admin/store/orders/${id}`);
    return response.data;
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
    const response = await apiClient.patch(`/admin/store/orders/${id}/status`, { status });
    return response.data;
  }

  async updatePaymentStatus(id: string, paymentStatus: Order['paymentStatus']): Promise<Order> {
    const response = await apiClient.patch(`/admin/store/orders/${id}/payment-status`, { paymentStatus });
    return response.data;
  }

  async addTrackingCode(id: string, trackingCode: string): Promise<Order> {
    const response = await apiClient.patch(`/admin/store/orders/${id}/tracking`, { trackingCode });
    return response.data;
  }

  async cancelOrder(id: string, reason?: string): Promise<Order> {
    const response = await apiClient.patch(`/admin/store/orders/${id}/cancel`, { reason });
    return response.data;
  }

  // Statistics
  async getStoreStats(): Promise<StoreStats> {
    const response = await apiClient.get('/admin/store/stats');
    return response.data;
  }

  // Categories
  async getCategories(): Promise<{ id: string; name: string; count: number }[]> {
    try {
      const response = await apiClient.get('/admin/store/categories');
      const data = response.data
      // aceitar diferentes formatos de resposta
      if (Array.isArray(data)) return data
      if (Array.isArray(data?.categories)) return data.categories
      if (Array.isArray(data?.data?.categories)) return data.data.categories
      // se vier em formato inesperado, tenta fallback
      throw new Error('Formato inesperado de categorias')
    } catch (err) {
      // Fallback para endpoint público
      const fallback = await apiClient.get('/store/categories');
      const fdata = fallback.data as any
      const cats: string[] = fdata?.categories || fdata?.data?.categories || []
      if (Array.isArray(cats)) {
        return cats.map((c: any) => ({ id: String(c.id || c), name: c.name || String(c), count: Number(c.count || 0) }))
      }
      return []
    }
  }

  async createCategory(name: string): Promise<{ id: string; name: string; count: number }> {
    // aceitar diferentes formatos de payload
    const payloads = [
      { name },
      { category: { name } },
    ]
    let lastError: any = null
    for (const body of payloads) {
      try {
        const response = await apiClient.post('/admin/store/categories', body);
        const res = response.data
        // aceitar diferentes formatos de resposta
        return res?.category || res?.data?.category || res
      } catch (err) {
        lastError = err
        // tenta próximo formato
        continue
      }
    }
    throw lastError
  }

  // Export
  async exportProducts(format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const response = await apiClient.get(`/admin/store/export/products?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async exportOrders(format: 'csv' | 'xlsx' = 'csv', filters?: OrderFilters): Promise<Blob> {
    const params = new URLSearchParams({
      format,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.paymentStatus && { paymentStatus: filters.paymentStatus }),
      ...(filters?.dateFrom && { dateFrom: filters.dateFrom }),
      ...(filters?.dateTo && { dateTo: filters.dateTo })
    });

    const response = await apiClient.get(`/admin/store/export/orders?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }
}

export const storeManagementService = new StoreManagementService();

// Export the class as named export
export { StoreManagementService };

export default StoreManagementService;