import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useCart } from '@/hooks/useCart';
import { CartItem } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, loading, total, updateCartItem, removeFromCart, clearCart } = useCart();
  
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [deliveryOption, setDeliveryOption] = useState('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderForm, setOrderForm] = useState({
    name: '',
    phone: '',
    email: '',
    comments: ''
  });

  // Financing calculator state
  const [financingCalculator, setFinancingCalculator] = useState({
    downPayment: 0,
    loanTerm: 36,
    interestRate: 12.5
  });

  useEffect(() => {
    // Select all items by default
    setSelectedItems(new Set(cartItems.map(item => item._id)));
  }, [cartItems]);

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU');
  };

  const calculateSelectedTotal = () => {
    return cartItems
      .filter(item => selectedItems.has(item._id))
      .reduce((sum, item) => sum + (item.car?.price || 0) * item.quantity, 0);
  };

  const calculateMonthlyPayment = (price: number, downPayment: number, months: number, rate: number) => {
    const loanAmount = price - downPayment;
    const monthlyRate = rate / 100 / 12;
    
    if (monthlyRate === 0) return loanAmount / months;
    
    return loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
           (Math.pow(1 + monthlyRate, months) - 1);
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(cartItems.map(item => item._id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    
    try {
      await updateCartItem(itemId, { quantity });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleUpdateFinancing = async (itemId: string, financing: CartItem['financing']) => {
    try {
      await updateCartItem(itemId, { financing });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleUpdateNotes = async (itemId: string, notes: string) => {
    try {
      await updateCartItem(itemId, { notes });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleApplyPromoCode = () => {
    // Simulate promo code validation
    const validCodes = {
      'SAVE10': 0.1,
      'FIRST15': 0.15,
      'PREMIUM20': 0.2
    };

    const discount = validCodes[promoCode as keyof typeof validCodes];
    if (discount) {
      setPromoDiscount(discount);
      toast({
        title: "Промокод применен",
        description: `Скидка ${discount * 100}% применена к заказу`,
      });
    } else {
      toast({
        title: "Неверный промокод",
        description: "Проверьте правильность введенного промокода",
        variant: "destructive",
      });
    }
  };

  const handleRemoveSelected = async () => {
    try {
      await Promise.all(
        Array.from(selectedItems).map(itemId => removeFromCart(itemId))
      );
      setSelectedItems(new Set());
      toast({
        title: "Удалено",
        description: "Выбранные автомобили удалены из корзины",
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleCheckout = () => {
    if (selectedItems.size === 0) {
      toast({
        title: "Выберите автомобили",
        description: "Выберите хотя бы один автомобиль для оформления заказа",
        variant: "destructive",
      });
      return;
    }

    if (!orderForm.name || !orderForm.phone) {
      toast({
        title: "Заполните данные",
        description: "Укажите имя и телефон для оформления заказа",
        variant: "destructive",
      });
      return;
    }

    // Simulate order creation
    console.log('Order data:', {
      items: cartItems.filter(item => selectedItems.has(item._id)),
      customer: orderForm,
      delivery: { option: deliveryOption, address: deliveryAddress },
      promoCode,
      discount: promoDiscount,
      total: calculateSelectedTotal() * (1 - promoDiscount)
    });

    toast({
      title: "Заказ оформлен",
      description: "Мы свяжемся с вами для подтверждения заказа",
    });

    navigate('/');
  };

  const selectedTotal = calculateSelectedTotal();
  const discountAmount = selectedTotal * promoDiscount;
  const finalTotal = selectedTotal - discountAmount;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-secondary text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Корзина</h1>
          <p className="text-xl opacity-90">
            {cartItems.length > 0 
              ? `${cartItems.length} ${cartItems.length === 1 ? 'автомобиль' : 'автомобилей'} в корзине`
              : 'Ваша корзина пуста'
            }
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {cartItems.length === 0 ? (
          // Empty cart state
          <div className="text-center py-16">
            <Icon name="ShoppingCart" size={64} className="mx-auto text-gray-400 mb-6" />
            <h2 className="text-2xl font-bold text-gray-600 mb-4">Ваша корзина пуста</h2>
            <p className="text-gray-500 mb-8">Добавьте автомобили из каталога, чтобы начать оформление заказа</p>
            <Link to="/catalog">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                <Icon name="Search" size={16} className="mr-2" />
                Перейти к каталогу
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cart Controls */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-4">
                      <Checkbox
                        checked={selectedItems.size === cartItems.length}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm font-medium">
                        Выбрать все ({cartItems.length})
                      </span>
                      {selectedItems.size > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveSelected}
                        >
                          <Icon name="Trash2" size={14} className="mr-1" />
                          Удалить выбранные
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearCart}
                    >
                      <Icon name="Trash2" size={14} className="mr-1" />
                      Очистить корзину
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Cart Items List */}
              {cartItems.map((item) => (
                <Card key={item._id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Checkbox and Image */}
                      <div className="flex items-start p-4 space-x-4">
                        <Checkbox
                          checked={selectedItems.has(item._id)}
                          onCheckedChange={(checked) => handleSelectItem(item._id, checked as boolean)}
                        />
                        <div className="relative">
                          <img
                            src={item.car?.images[0] || '/placeholder.svg'}
                            alt={item.car ? `${item.car.brand} ${item.car.model}` : 'Car'}
                            className="w-32 h-24 object-cover rounded-lg"
                          />
                          {item.car?.isNew && (
                            <Badge className="absolute -top-2 -right-2 bg-green-600">Новый</Badge>
                          )}
                        </div>
                      </div>

                      {/* Car Info */}
                      <div className="flex-1 p-4">
                        <div className="flex flex-col lg:flex-row justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-2">
                              {item.car ? `${item.car.brand} ${item.car.model}` : 'Загрузка...'}
                            </h3>
                            
                            {item.car && (
                              <div className="grid grid-cols-2 gap-2 mb-3 text-sm text-gray-600">
                                <div>Год: {item.car.year}</div>
                                <div>Пробег: {formatPrice(item.car.mileage)} км</div>
                                <div>Топливо: {item.car.fuelType}</div>
                                <div>КПП: {item.car.transmission}</div>
                              </div>
                            )}

                            {/* Quantity */}
                            <div className="flex items-center space-x-2 mb-3">
                              <span className="text-sm">Количество:</span>
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="w-8 h-8"
                                  onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  <Icon name="Minus" size={12} />
                                </Button>
                                <span className="w-8 text-center text-sm">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="w-8 h-8"
                                  onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                                >
                                  <Icon name="Plus" size={12} />
                                </Button>
                              </div>
                            </div>

                            {/* Financing Options */}
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">Способ покупки:</span>
                                <Select
                                  value={item.financing?.type || 'cash'}
                                  onValueChange={(value) => handleUpdateFinancing(item._id, {
                                    ...item.financing,
                                    type: value as 'cash' | 'credit' | 'leasing'
                                  })}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="cash">Наличные</SelectItem>
                                    <SelectItem value="credit">Кредит</SelectItem>
                                    <SelectItem value="leasing">Лизинг</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {item.financing?.type === 'credit' && item.car && (
                                <div className="bg-blue-50 p-3 rounded-lg">
                                  <div className="text-sm">
                                    <div>Первоначальный взнос: {formatPrice(item.financing.downPayment || 0)} ₽</div>
                                    <div>Срок: {item.financing.loanTerm || 36} мес.</div>
                                    <div className="font-medium text-blue-700">
                                      Ежемесячный платеж: {formatPrice(
                                        calculateMonthlyPayment(
                                          item.car.price,
                                          item.financing.downPayment || 0,
                                          item.financing.loanTerm || 36,
                                          12.5
                                        )
                                      )} ₽
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Notes */}
                            <div className="mt-3">
                              <Textarea
                                placeholder="Комментарии к заказу..."
                                value={item.notes || ''}
                                onChange={(e) => handleUpdateNotes(item._id, e.target.value)}
                                rows={2}
                                className="text-sm"
                              />
                            </div>
                          </div>

                          {/* Price and Actions */}
                          <div className="lg:ml-6 mt-4 lg:mt-0 text-right">
                            <div className="text-2xl font-bold text-primary mb-4">
                              {item.car ? formatPrice(item.car.price * item.quantity) : '—'} ₽
                            </div>
                            
                            <div className="space-y-2">
                              {item.car && (
                                <Link to={`/car/${item.car._id}`}>
                                  <Button variant="outline" size="sm" className="w-full">
                                    <Icon name="Eye" size={14} className="mr-1" />
                                    Подробнее
                                  </Button>
                                </Link>
                              )}
                              
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-red-600 hover:text-red-700"
                                onClick={() => removeFromCart(item._id)}
                              >
                                <Icon name="Trash2" size={14} className="mr-1" />
                                Удалить
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-6">
                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Итого по заказу</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Выбрано автомобилей:</span>
                        <span>{selectedItems.size}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Стоимость:</span>
                        <span>{formatPrice(selectedTotal)} ₽</span>
                      </div>
                      
                      {promoDiscount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Скидка ({promoCode}):</span>
                          <span>-{formatPrice(discountAmount)} ₽</span>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div className="flex justify-between font-bold text-lg">
                        <span>К оплате:</span>
                        <span className="text-primary">{formatPrice(finalTotal)} ₽</span>
                      </div>
                    </div>

                    {/* Promo Code */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Промокод</label>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Введите промокод"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        />
                        <Button variant="outline" onClick={handleApplyPromoCode}>
                          Применить
                        </Button>
                      </div>
                    </div>

                    {/* Delivery Options */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Способ получения</label>
                      <Select value={deliveryOption} onValueChange={setDeliveryOption}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pickup">Самовывоз (бесплатно)</SelectItem>
                          <SelectItem value="delivery">Доставка (+50,000 ₽)</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {deliveryOption === 'delivery' && (
                        <Textarea
                          placeholder="Адрес доставки..."
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          rows={2}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Контактная информация</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Имя *</label>
                      <Input
                        required
                        value={orderForm.name}
                        onChange={(e) => setOrderForm({...orderForm, name: e.target.value})}
                        placeholder="Ваше имя"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Телефон *</label>
                      <Input
                        required
                        type="tel"
                        value={orderForm.phone}
                        onChange={(e) => setOrderForm({...orderForm, phone: e.target.value})}
                        placeholder="+7 (999) 123-45-67"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Email</label>
                      <Input
                        type="email"
                        value={orderForm.email}
                        onChange={(e) => setOrderForm({...orderForm, email: e.target.value})}
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Комментарии</label>
                      <Textarea
                        value={orderForm.comments}
                        onChange={(e) => setOrderForm({...orderForm, comments: e.target.value})}
                        placeholder="Дополнительные пожелания..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Financing Calculator */}
                {selectedTotal > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Icon name="Calculator" size={16} className="mr-2" />
                        Кредитный калькулятор
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Первоначальный взнос: {formatPrice(financingCalculator.downPayment)} ₽
                        </label>
                        <input
                          type="range"
                          min="0"
                          max={selectedTotal * 0.8}
                          step="50000"
                          value={financingCalculator.downPayment}
                          onChange={(e) => setFinancingCalculator({
                            ...financingCalculator,
                            downPayment: parseInt(e.target.value)
                          })}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Срок кредита: {financingCalculator.loanTerm} мес.
                        </label>
                        <input
                          type="range"
                          min="12"
                          max="84"
                          step="6"
                          value={financingCalculator.loanTerm}
                          onChange={(e) => setFinancingCalculator({
                            ...financingCalculator,
                            loanTerm: parseInt(e.target.value)
                          })}
                          className="w-full"
                        />
                      </div>

                      <div className="bg-primary/5 p-4 rounded-lg text-center">
                        <div className="text-lg font-bold text-primary">
                          {formatPrice(calculateMonthlyPayment(
                            selectedTotal,
                            financingCalculator.downPayment,
                            financingCalculator.loanTerm,
                            financingCalculator.interestRate
                          ))} ₽/мес
                        </div>
                        <div className="text-sm text-gray-600">Ежемесячный платеж</div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={selectedItems.size === 0}
                  >
                    <Icon name="CreditCard" size={16} className="mr-2" />
                    Оформить заказ
                  </Button>
                  
                  <Link to="/catalog">
                    <Button variant="outline" className="w-full">
                      <Icon name="ArrowLeft" size={16} className="mr-2" />
                      Продолжить покупки
                    </Button>
                  </Link>
                </div>

                {/* Additional Info */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <Icon name="Shield" size={16} className="text-green-600" />
                        <span>Безопасная оплата</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Icon name="Truck" size={16} className="text-blue-600" />
                        <span>Бесплатная доставка по Москве</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Icon name="Award" size={16} className="text-purple-600" />
                        <span>Гарантия на все автомобили</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Icon name="Headphones" size={16} className="text-orange-600" />
                        <span>Поддержка 24/7</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;