import { useState, useEffect, useCallback } from 'react';
import { apiClient, CartItem } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      const items = await apiClient.getCartItems();
      setCartItems(items);
      
      const totalAmount = await apiClient.getCartTotal();
      setTotal(totalAmount);
    } catch (error) {
      console.error('Failed to load cart:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить корзину",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = useCallback(async (carId: string, options?: Partial<CartItem>) => {
    try {
      setLoading(true);
      const newItem = await apiClient.addToCart(carId, options);
      await loadCart(); // Перезагружаем корзину
      
      toast({
        title: "Успешно!",
        description: "Автомобиль добавлен в корзину",
      });
      
      return newItem;
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось добавить в корзину",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadCart]);

  const updateCartItem = useCallback(async (itemId: string, updates: Partial<CartItem>) => {
    try {
      setLoading(true);
      await apiClient.updateCartItem(itemId, updates);
      await loadCart();
      
      toast({
        title: "Обновлено",
        description: "Элемент корзины обновлен",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить элемент",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [loadCart]);

  const removeFromCart = useCallback(async (itemId: string) => {
    try {
      setLoading(true);
      await apiClient.removeFromCart(itemId);
      await loadCart();
      
      toast({
        title: "Удалено",
        description: "Автомобиль удален из корзины",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить из корзины",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [loadCart]);

  const clearCart = useCallback(async () => {
    try {
      setLoading(true);
      await apiClient.clearCart();
      setCartItems([]);
      setTotal(0);
      
      toast({
        title: "Очищено",
        description: "Корзина очищена",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось очистить корзину",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const getCartItemsCount = useCallback(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  return {
    cartItems,
    loading,
    total,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    loadCart,
    getCartItemsCount,
  };
};