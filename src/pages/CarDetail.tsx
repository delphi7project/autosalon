import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useCart } from '@/hooks/useCart';
import { apiClient, Car } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const CarDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, loading: cartLoading } = useCart();
  
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [relatedCars, setRelatedCars] = useState<Car[]>([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Forms state
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
    preferredTime: ''
  });

  const [testDriveForm, setTestDriveForm] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    time: '',
    experience: ''
  });

  const [financingForm, setFinancingForm] = useState({
    name: '',
    phone: '',
    email: '',
    income: '',
    downPayment: '',
    loanTerm: ''
  });

  // Load car data
  const loadCar = async () => {
    if (!id) {
      setError('ID автомобиля не указан');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getCarById(id);
      setCar(response.data);
      
      // Load related cars (same brand)
      if (response.data.brand) {
        try {
          const relatedResponse = await apiClient.getCarsByBrand(response.data.brand);
          const filtered = relatedResponse.data.filter(relatedCar => relatedCar._id !== id).slice(0, 4);
          setRelatedCars(filtered);
        } catch (err) {
          console.error('Failed to load related cars:', err);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Автомобиль не найден');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCar();
  }, [id]);

  // Handlers
  const handleAddToCart = async () => {
    if (!car) return;
    
    try {
      await addToCart(car._id);
    } catch (error) {
      // Error is handled in useCart hook
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Contact form:', contactForm);
    toast({
      title: "Заявка отправлена",
      description: "Мы свяжемся с вами в ближайшее время",
    });
  };

  const handleTestDriveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Test drive form:', testDriveForm);
    toast({
      title: "Запись на тест-драйв",
      description: "Ваша заявка принята, мы подтвердим время",
    });
  };

  const handleFinancingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Financing form:', financingForm);
    toast({
      title: "Заявка на кредит",
      description: "Ваша заявка отправлена на рассмотрение",
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU');
  };

  const calculateMonthlyPayment = (price: number, downPayment: number = 0, months: number = 36) => {
    const loanAmount = price - downPayment;
    const monthlyRate = 0.125 / 12; // 12.5% годовых
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                          (Math.pow(1 + monthlyRate, months) - 1);
    return monthlyPayment;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error || !car) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="AlertCircle" size={48} className="mx-auto text-red-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Автомобиль не найден</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => navigate('/catalog')}>
            <Icon name="ArrowLeft" size={16} className="mr-2" />
            Вернуться к каталогу
          </Button>
        </div>
      </div>
    );
  }

  const ContactForm = () => (
    <form onSubmit={handleContactSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Имя *</label>
          <Input
            required
            value={contactForm.name}
            onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
            placeholder="Ваше имя"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Телефон *</label>
          <Input
            required
            type="tel"
            value={contactForm.phone}
            onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
            placeholder="+7 (999) 123-45-67"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Email</label>
        <Input
          type="email"
          value={contactForm.email}
          onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
          placeholder="your@email.com"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Удобное время для звонка</label>
        <Select value={contactForm.preferredTime} onValueChange={(value) => setContactForm({...contactForm, preferredTime: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите время" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="morning">Утром (9:00-12:00)</SelectItem>
            <SelectItem value="afternoon">Днем (12:00-15:00)</SelectItem>
            <SelectItem value="evening">Вечером (15:00-18:00)</SelectItem>
            <SelectItem value="anytime">В любое время</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Сообщение</label>
        <Textarea
          value={contactForm.message}
          onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
          placeholder="Дополнительная информация..."
          rows={3}
        />
      </div>
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
        Отправить заявку
      </Button>
    </form>
  );

  const TestDriveForm = () => (
    <form onSubmit={handleTestDriveSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Имя *</label>
          <Input
            required
            value={testDriveForm.name}
            onChange={(e) => setTestDriveForm({...testDriveForm, name: e.target.value})}
            placeholder="Ваше имя"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Телефон *</label>
          <Input
            required
            type="tel"
            value={testDriveForm.phone}
            onChange={(e) => setTestDriveForm({...testDriveForm, phone: e.target.value})}
            placeholder="+7 (999) 123-45-67"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Email</label>
        <Input
          type="email"
          value={testDriveForm.email}
          onChange={(e) => setTestDriveForm({...testDriveForm, email: e.target.value})}
          placeholder="your@email.com"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Дата *</label>
          <Input
            required
            type="date"
            value={testDriveForm.date}
            onChange={(e) => setTestDriveForm({...testDriveForm, date: e.target.value})}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Время *</label>
          <Select value={testDriveForm.time} onValueChange={(value) => setTestDriveForm({...testDriveForm, time: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите время" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="09:00">09:00</SelectItem>
              <SelectItem value="10:00">10:00</SelectItem>
              <SelectItem value="11:00">11:00</SelectItem>
              <SelectItem value="12:00">12:00</SelectItem>
              <SelectItem value="14:00">14:00</SelectItem>
              <SelectItem value="15:00">15:00</SelectItem>
              <SelectItem value="16:00">16:00</SelectItem>
              <SelectItem value="17:00">17:00</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Водительский стаж</label>
        <Select value={testDriveForm.experience} onValueChange={(value) => setTestDriveForm({...testDriveForm, experience: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите стаж" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="less-1">Менее 1 года</SelectItem>
            <SelectItem value="1-3">1-3 года</SelectItem>
            <SelectItem value="3-5">3-5 лет</SelectItem>
            <SelectItem value="5-10">5-10 лет</SelectItem>
            <SelectItem value="more-10">Более 10 лет</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
        Записаться на тест-драйв
      </Button>
    </form>
  );

  const FinancingForm = () => (
    <form onSubmit={handleFinancingSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Имя *</label>
          <Input
            required
            value={financingForm.name}
            onChange={(e) => setFinancingForm({...financingForm, name: e.target.value})}
            placeholder="Ваше имя"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Телефон *</label>
          <Input
            required
            type="tel"
            value={financingForm.phone}
            onChange={(e) => setFinancingForm({...financingForm, phone: e.target.value})}
            placeholder="+7 (999) 123-45-67"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Email</label>
        <Input
          type="email"
          value={financingForm.email}
          onChange={(e) => setFinancingForm({...financingForm, email: e.target.value})}
          placeholder="your@email.com"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Ежемесячный доход</label>
          <Input
            type="number"
            value={financingForm.income}
            onChange={(e) => setFinancingForm({...financingForm, income: e.target.value})}
            placeholder="100000"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Первоначальный взнос</label>
          <Input
            type="number"
            value={financingForm.downPayment}
            onChange={(e) => setFinancingForm({...financingForm, downPayment: e.target.value})}
            placeholder="500000"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Срок кредита</label>
        <Select value={financingForm.loanTerm} onValueChange={(value) => setFinancingForm({...financingForm, loanTerm: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите срок" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12">12 месяцев</SelectItem>
            <SelectItem value="24">24 месяца</SelectItem>
            <SelectItem value="36">36 месяцев</SelectItem>
            <SelectItem value="48">48 месяцев</SelectItem>
            <SelectItem value="60">60 месяцев</SelectItem>
            <SelectItem value="72">72 месяца</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {financingForm.downPayment && financingForm.loanTerm && (
        <div className="bg-primary/5 p-4 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {formatPrice(calculateMonthlyPayment(
                car.price, 
                parseInt(financingForm.downPayment), 
                parseInt(financingForm.loanTerm)
              ))} ₽/мес
            </div>
            <div className="text-sm text-gray-600">Примерный ежемесячный платеж</div>
          </div>
        </div>
      )}
      
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
        Подать заявку на кредит
      </Button>
    </form>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 py-4">
        <div className="container mx-auto px-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-primary">Главная</Link>
            <Icon name="ChevronRight" size={14} />
            <Link to="/catalog" className="hover:text-primary">Каталог</Link>
            <Icon name="ChevronRight" size={14} />
            <Link to={`/catalog?brand=${car.brand.toLowerCase()}`} className="hover:text-primary">{car.brand}</Link>
            <Icon name="ChevronRight" size={14} />
            <span className="text-gray-900">{car.model}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Images and Main Info */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="mb-8">
              <div className="relative mb-4">
                <img 
                  src={car.images[selectedImage] || '/placeholder.svg'} 
                  alt={`${car.brand} ${car.model}`}
                  className="w-full h-96 object-cover rounded-lg cursor-pointer"
                  onClick={() => setIsImageModalOpen(true)}
                />
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {car.isNew && <Badge className="bg-green-600">Новый</Badge>}
                  {car.isHit && <Badge className="bg-primary">Хит продаж</Badge>}
                  {car.status === 'available' && <Badge className="bg-blue-600">В наличии</Badge>}
                </div>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-4 right-4 bg-white/80 hover:bg-white"
                  onClick={() => setIsImageModalOpen(true)}
                >
                  <Icon name="Expand" size={16} />
                </Button>
              </div>
              
              {car.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {car.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                        selectedImage === index ? 'border-primary' : 'border-gray-200'
                      }`}
                    >
                      <img src={image} alt={`${car.brand} ${car.model} ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Car Details Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Обзор</TabsTrigger>
                <TabsTrigger value="specs">Характеристики</TabsTrigger>
                <TabsTrigger value="equipment">Комплектация</TabsTrigger>
                <TabsTrigger value="documents">Документы</TabsTrigger>
                <TabsTrigger value="history">История</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6 mt-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Описание</h3>
                  <p className="text-gray-600 leading-relaxed">{car.description}</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <Icon name="Zap" size={24} className="text-primary mx-auto mb-2" />
                    <div className="font-semibold">{car.engineVolume}L</div>
                    <div className="text-sm text-gray-600">{car.power} л.с.</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <Icon name="Activity" size={24} className="text-primary mx-auto mb-2" />
                    <div className="font-semibold">0-100 км/ч</div>
                    <div className="text-sm text-gray-600">7.1 сек</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <Icon name="Gauge" size={24} className="text-primary mx-auto mb-2" />
                    <div className="font-semibold">Расход</div>
                    <div className="text-sm text-gray-600">6.8 л/100км</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <Icon name="Settings" size={24} className="text-primary mx-auto mb-2" />
                    <div className="font-semibold">{car.transmission}</div>
                    <div className="text-sm text-gray-600">{car.bodyType}</div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h4 className="font-semibold mb-3">Основные особенности</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {car.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Icon name="Check" size={14} className="text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="specs" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-secondary">Двигатель и трансмиссия</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Объем двигателя:</span>
                        <span>{car.engineVolume} л</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Мощность:</span>
                        <span>{car.power} л.с.</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Тип топлива:</span>
                        <span>{car.fuelType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">КПП:</span>
                        <span>{car.transmission}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Тип кузова:</span>
                        <span>{car.bodyType}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-secondary">Общая информация</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Год выпуска:</span>
                        <span>{car.year}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Пробег:</span>
                        <span>{formatPrice(car.mileage)} км</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Цвет:</span>
                        <span>{car.color}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Состояние:</span>
                        <span>{car.isNew ? 'Новый' : 'Подержанный'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Статус:</span>
                        <span className="capitalize">{car.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="equipment" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-secondary">Комплектация</h4>
                    <div className="space-y-2">
                      {car.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Icon name="Check" size={16} className="text-green-600" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-secondary">Дополнительные опции</h4>
                    <div className="space-y-2">
                      {[
                        'Система навигации',
                        'Камера заднего вида',
                        'Парковочные датчики',
                        'Автоматический климат-контроль',
                        'Подогрев руля',
                        'Память сидений'
                      ].map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Icon name="Plus" size={16} className="text-blue-600" />
                          <span className="text-sm">{option}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="documents" className="space-y-6 mt-6">
                <div>
                  <h4 className="font-semibold mb-4 text-secondary">Документы и информация</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium mb-2">VIN номер</h5>
                      <p className="text-sm text-gray-600 font-mono">{car.vin}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium mb-2">Год выпуска</h5>
                      <p className="text-sm text-gray-600">{car.year}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium mb-2">Цвет</h5>
                      <p className="text-sm text-gray-600">{car.color}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium mb-2">Пробег</h5>
                      <p className="text-sm text-gray-600">{formatPrice(car.mileage)} км</p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h5 className="font-medium mb-3">Доступные документы</h5>
                    <div className="space-y-2">
                      {[
                        'Паспорт транспортного средства (ПТС)',
                        'Свидетельство о регистрации ТС (СТС)',
                        'Сервисная книжка',
                        'Договор купли-продажи',
                        'Справка о ДТП'
                      ].map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Icon name="FileText" size={16} className="text-primary" />
                            <span className="text-sm">{doc}</span>
                          </div>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Доступен
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-6 mt-6">
                <div>
                  <h4 className="font-semibold mb-4 text-secondary">История автомобиля</h4>
                  
                  <div className="space-y-4">
                    <div className="border-l-4 border-primary pl-4">
                      <div className="font-medium">Добавлен в каталог</div>
                      <div className="text-sm text-gray-600">
                        {new Date(car.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                    
                    {!car.isNew && (
                      <>
                        <div className="border-l-4 border-blue-500 pl-4">
                          <div className="font-medium">Последнее техническое обслуживание</div>
                          <div className="text-sm text-gray-600">15.01.2024 - Замена масла и фильтров</div>
                        </div>
                        
                        <div className="border-l-4 border-green-500 pl-4">
                          <div className="font-medium">Проверка на ДТП</div>
                          <div className="text-sm text-gray-600">Автомобиль не участвовал в серьезных ДТП</div>
                        </div>
                      </>
                    )}
                    
                    <div className="border-l-4 border-yellow-500 pl-4">
                      <div className="font-medium">Гарантия</div>
                      <div className="text-sm text-gray-600">
                        {car.isNew ? 'Заводская гарантия 3 года' : 'Гарантия дилера 1 год'}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Price and Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-secondary">{car.brand} {car.model}</CardTitle>
                  <div className="text-3xl font-bold text-primary">{formatPrice(car.price)} ₽</div>
                  <div className="text-sm text-gray-600">
                    Примерный платеж: {formatPrice(calculateMonthlyPayment(car.price))} ₽/мес
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Год:</span>
                      <div className="font-medium">{car.year}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Пробег:</span>
                      <div className="font-medium">{formatPrice(car.mileage)} км</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Топливо:</span>
                      <div className="font-medium">{car.fuelType}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">КПП:</span>
                      <div className="font-medium">{car.transmission}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={handleAddToCart}
                      disabled={cartLoading}
                    >
                      <Icon name="ShoppingCart" size={16} className="mr-2" />
                      {cartLoading ? 'Добавление...' : 'Добавить в корзину'}
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full" variant="outline">
                          <Icon name="Phone" size={16} className="mr-2" />
                          Связаться с менеджером
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Связаться с менеджером</DialogTitle>
                        </DialogHeader>
                        <ContactForm />
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Icon name="Car" size={16} className="mr-2" />
                          Записаться на тест-драйв
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Запись на тест-драйв</DialogTitle>
                        </DialogHeader>
                        <TestDriveForm />
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Icon name="Calculator" size={16} className="mr-2" />
                          Рассчитать кредит
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Заявка на кредит</DialogTitle>
                        </DialogHeader>
                        <FinancingForm />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* Manager Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ваш менеджер</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon name="User" size={20} className="text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Алексей Петров</div>
                      <div className="text-sm text-gray-600">Старший менеджер</div>
                      <div className="flex items-center space-x-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Icon key={star} name="Star" size={12} className="text-yellow-500 fill-current" />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">4.9</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Icon name="Phone" size={14} className="text-gray-400" />
                      <span>+7 (495) 123-45-67</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Icon name="Mail" size={14} className="text-gray-400" />
                      <span>a.petrov@autopremium.ru</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Icon name="MessageCircle" size={14} className="text-gray-400" />
                      <span>WhatsApp: +7 (999) 123-45-67</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Services */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Дополнительные услуги</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link to="/trade-in" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-2">
                      <Icon name="RefreshCw" size={16} className="text-primary" />
                      <span className="text-sm">Trade-in</span>
                    </div>
                    <Icon name="ChevronRight" size={14} className="text-gray-400" />
                  </Link>
                  <Link to="/insurance" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-2">
                      <Icon name="Shield" size={16} className="text-primary" />
                      <span className="text-sm">Страхование</span>
                    </div>
                    <Icon name="ChevronRight" size={14} className="text-gray-400" />
                  </Link>
                  <Link to="/warranty" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-2">
                      <Icon name="Award" size={16} className="text-primary" />
                      <span className="text-sm">Гарантия</span>
                    </div>
                    <Icon name="ChevronRight" size={14} className="text-gray-400" />
                  </Link>
                  <Link to="/service" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-2">
                      <Icon name="Wrench" size={16} className="text-primary" />
                      <span className="text-sm">Сервис</span>
                    </div>
                    <Icon name="ChevronRight" size={14} className="text-gray-400" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Related Cars */}
        {relatedCars.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-secondary mb-8">Похожие автомобили</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedCars.map((relatedCar) => (
                <Card key={relatedCar._id} className="hover:shadow-lg transition-shadow">
                  <div className="relative overflow-hidden">
                    <img 
                      src={relatedCar.images[0] || '/placeholder.svg'} 
                      alt={`${relatedCar.brand} ${relatedCar.model}`}
                      className="w-full h-40 object-cover"
                    />
                    {relatedCar.isNew && (
                      <Badge className="absolute top-2 right-2 bg-green-600">Новый</Badge>
                    )}
                  </div>
                  <CardContent className="pt-4">
                    <h4 className="font-semibold mb-2">{relatedCar.brand} {relatedCar.model}</h4>
                    <div className="text-lg font-bold text-primary mb-2">
                      {formatPrice(relatedCar.price)} ₽
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      {relatedCar.year} • {formatPrice(relatedCar.mileage)} км
                    </div>
                    <Link to={`/car/${relatedCar._id}`}>
                      <Button size="sm" className="w-full">
                        Подробнее
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{car.brand} {car.model} - Фото {selectedImage + 1}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <img 
              src={car.images[selectedImage] || '/placeholder.svg'} 
              alt={`${car.brand} ${car.model}`}
              className="w-full h-auto max-h-[70vh] object-contain"
            />
            {car.images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2"
                  onClick={() => setSelectedImage(selectedImage > 0 ? selectedImage - 1 : car.images.length - 1)}
                >
                  <Icon name="ChevronLeft" size={16} />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2"
                  onClick={() => setSelectedImage(selectedImage < car.images.length - 1 ? selectedImage + 1 : 0)}
                >
                  <Icon name="ChevronRight" size={16} />
                </Button>
              </>
            )}
          </div>
          {car.images.length > 1 && (
            <div className="flex gap-2 justify-center mt-4 overflow-x-auto">
              {car.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-primary' : 'border-gray-200'
                  }`}
                >
                  <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CarDetail;