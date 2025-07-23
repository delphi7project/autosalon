// API клиент для работы с backend
const API_BASE_URL = 'http://localhost:3001/api';

export interface Car {
  _id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType: string;
  engineVolume: number;
  power: number;
  color: string;
  vin: string;
  status: string;
  images: string[];
  features: string[];
  description: string;
  isNew: boolean;
  isHit: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  _id: string;
  userId: string;
  carId: string;
  car?: Car;
  quantity: number;
  addedAt: string;
  notes?: string;
  financing?: {
    type: 'cash' | 'credit' | 'leasing';
    downPayment?: number;
    loanTerm?: number;
    monthlyPayment?: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
  error?: string;
}

export interface CarFilters {
  brand?: string;
  model?: string;
  year?: number;
  minPrice?: number;
  maxPrice?: number;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Cars API
  async getCars(filters: CarFilters = {}): Promise<ApiResponse<Car[]>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/cars${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<Car[]>(endpoint);
  }

  async getCarById(id: string): Promise<ApiResponse<Car>> {
    return this.request<Car>(`/cars/${id}`);
  }

  async getCarsByBrand(brand: string): Promise<ApiResponse<Car[]>> {
    return this.request<Car[]>(`/cars/brand/${brand}`);
  }

  async getAvailableCars(): Promise<ApiResponse<Car[]>> {
    return this.request<Car[]>('/cars/available');
  }

  async getCarStatistics(): Promise<ApiResponse<any>> {
    return this.request<any>('/cars/statistics');
  }

  // Cart API (будем использовать localStorage для демонстрации)
  async getCartItems(): Promise<CartItem[]> {
    const items = localStorage.getItem('cart');
    if (!items) return [];
    
    const cartItems: CartItem[] = JSON.parse(items);
    
    // Загружаем данные об автомобилях для каждого элемента корзины
    const itemsWithCars = await Promise.all(
      cartItems.map(async (item) => {
        try {
          const carResponse = await this.getCarById(item.carId);
          return { ...item, car: carResponse.data };
        } catch (error) {
          console.error('Failed to load car data for cart item:', error);
          return item;
        }
      })
    );
    
    return itemsWithCars;
  }

  async addToCart(carId: string, options?: Partial<CartItem>): Promise<CartItem> {
    const cartItems = await this.getCartItems();
    
    // Проверяем, есть ли уже этот автомобиль в корзине
    const existingItem = cartItems.find(item => item.carId === carId);
    
    if (existingItem) {
      throw new Error('Этот автомобиль уже добавлен в корзину');
    }

    const newItem: CartItem = {
      _id: Date.now().toString(),
      userId: 'guest', // В реальном приложении здесь был бы ID пользователя
      carId,
      quantity: 1,
      addedAt: new Date().toISOString(),
      ...options,
    };

    const updatedCart = [...cartItems, newItem];
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    
    // Загружаем данные об автомобиле
    try {
      const carResponse = await this.getCarById(carId);
      newItem.car = carResponse.data;
    } catch (error) {
      console.error('Failed to load car data:', error);
    }
    
    return newItem;
  }

  async updateCartItem(itemId: string, updates: Partial<CartItem>): Promise<CartItem> {
    const cartItems = await this.getCartItems();
    const itemIndex = cartItems.findIndex(item => item._id === itemId);
    
    if (itemIndex === -1) {
      throw new Error('Элемент корзины не найден');
    }

    const updatedItem = { ...cartItems[itemIndex], ...updates };
    cartItems[itemIndex] = updatedItem;
    
    localStorage.setItem('cart', JSON.stringify(cartItems));
    return updatedItem;
  }

  async removeFromCart(itemId: string): Promise<void> {
    const cartItems = await this.getCartItems();
    const filteredItems = cartItems.filter(item => item._id !== itemId);
    localStorage.setItem('cart', JSON.stringify(filteredItems));
  }

  async clearCart(): Promise<void> {
    localStorage.removeItem('cart');
  }

  async getCartTotal(): Promise<number> {
    const cartItems = await this.getCartItems();
    return cartItems.reduce((total, item) => {
      return total + (item.car?.price || 0) * item.quantity;
    }, 0);
  }
}

export const apiClient = new ApiClient();