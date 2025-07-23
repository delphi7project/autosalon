import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PaginationComponent } from '@/components/ui/pagination-component';
import { useCart } from '@/hooks/useCart';
import { apiClient, Car, CarFilters } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart, loading: cartLoading } = useCart();
  
  // State
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCars, setTotalCars] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [compareList, setCompareList] = useState<Set<string>>(new Set());

  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || 'all');
  const [selectedModel, setSelectedModel] = useState(searchParams.get('model') || 'all');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'all');
  const [selectedFuelType, setSelectedFuelType] = useState(searchParams.get('fuel') || 'all');
  const [selectedTransmission, setSelectedTransmission] = useState(searchParams.get('transmission') || 'all');
  const [priceRange, setPriceRange] = useState([
    parseInt(searchParams.get('minPrice') || '0'),
    parseInt(searchParams.get('maxPrice') || '10000000')
  ]);
  const [yearRange, setYearRange] = useState([
    parseInt(searchParams.get('minYear') || '2015'),
    parseInt(searchParams.get('maxYear') || '2024')
  ]);
  const [mileageRange, setMileageRange] = useState([
    parseInt(searchParams.get('minMileage') || '0'),
    parseInt(searchParams.get('maxMileage') || '200000')
  ]);
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'price-asc');
  const [showOnlyNew, setShowOnlyNew] = useState(searchParams.get('new') === 'true');
  const [showOnlyHits, setShowOnlyHits] = useState(searchParams.get('hits') === 'true');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(searchParams.get('available') !== 'false');

  // Available options (будут загружаться из API)
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [statistics, setStatistics] = useState<any>(null);

  // Load cars data
  const loadCars = async (filters: CarFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getCars({
        ...filters,
        page: currentPage,
        limit: itemsPerPage,
      });
      
      setCars(response.data);
      setTotalCars(response.count || 0);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки автомобилей');
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить каталог автомобилей",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load statistics and available options
  const loadStatistics = async () => {
    try {
      const response = await apiClient.getCarStatistics();
      setStatistics(response.data);
      
      // Извлекаем доступные бренды и модели из статистики
      if (response.data.byBrand) {
        setAvailableBrands(Object.keys(response.data.byBrand));
      }
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  };

  // Build filters object
  const buildFilters = useMemo((): CarFilters => {
    const filters: CarFilters = {};
    
    if (searchTerm) filters.model = searchTerm;
    if (selectedBrand !== 'all') filters.brand = selectedBrand;
    if (selectedType !== 'all') filters.bodyType = selectedType;
    if (selectedFuelType !== 'all') filters.fuelType = selectedFuelType;
    if (selectedTransmission !== 'all') filters.transmission = selectedTransmission;
    if (priceRange[0] > 0) filters.minPrice = priceRange[0];
    if (priceRange[1] < 10000000) filters.maxPrice = priceRange[1];
    
    // Сортировка
    const [sortField, sortOrder] = sortBy.split('-');
    filters.sortBy = sortField;
    filters.sortOrder = sortOrder as 'asc' | 'desc';
    
    return filters;
  }, [
    searchTerm, selectedBrand, selectedType, selectedFuelType, 
    selectedTransmission, priceRange, sortBy
  ]);

  // Update URL params
  const updateURLParams = () => {
    const params = new URLSearchParams();
    
    if (searchTerm) params.set('search', searchTerm);
    if (selectedBrand !== 'all') params.set('brand', selectedBrand);
    if (selectedModel !== 'all') params.set('model', selectedModel);
    if (selectedType !== 'all') params.set('type', selectedType);
    if (selectedFuelType !== 'all') params.set('fuel', selectedFuelType);
    if (selectedTransmission !== 'all') params.set('transmission', selectedTransmission);
    if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
    if (priceRange[1] < 10000000) params.set('maxPrice', priceRange[1].toString());
    if (yearRange[0] > 2015) params.set('minYear', yearRange[0].toString());
    if (yearRange[1] < 2024) params.set('maxYear', yearRange[1].toString());
    if (sortBy !== 'price-asc') params.set('sortBy', sortBy);
    if (showOnlyNew) params.set('new', 'true');
    if (showOnlyHits) params.set('hits', 'true');
    if (!showOnlyAvailable) params.set('available', 'false');
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    setSearchParams(params);
  };

  // Effects
  useEffect(() => {
    loadStatistics();
  }, []);

  useEffect(() => {
    loadCars(buildFilters);
  }, [buildFilters, currentPage, itemsPerPage]);

  useEffect(() => {
    updateURLParams();
  }, [
    searchTerm, selectedBrand, selectedModel, selectedType, selectedFuelType,
    selectedTransmission, priceRange, yearRange, sortBy, showOnlyNew, 
    showOnlyHits, showOnlyAvailable, currentPage
  ]);

  // Handlers
  const handleAddToCart = async (car: Car) => {
    try {
      await addToCart(car._id);
    } catch (error) {
      // Error is handled in useCart hook
    }
  };

  const handleToggleFavorite = (carId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(carId)) {
      newFavorites.delete(carId);
      toast({
        title: "Удалено",
        description: "Автомобиль удален из избранного",
      });
    } else {
      newFavorites.add(carId);
      toast({
        title: "Добавлено",
        description: "Автомобиль добавлен в избранное",
      });
    }
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify([...newFavorites]));
  };

  const handleToggleCompare = (carId: string) => {
    const newCompareList = new Set(compareList);
    if (newCompareList.has(carId)) {
      newCompareList.delete(carId);
    } else if (newCompareList.size < 3) {
      newCompareList.add(carId);
    } else {
      toast({
        title: "Ограничение",
        description: "Можно сравнивать не более 3 автомобилей",
        variant: "destructive",
      });
      return;
    }
    setCompareList(newCompareList);
    localStorage.setItem('compare', JSON.stringify([...newCompareList]));
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedBrand('all');
    setSelectedModel('all');
    setSelectedType('all');
    setSelectedFuelType('all');
    setSelectedTransmission('all');
    setPriceRange([0, 10000000]);
    setYearRange([2015, 2024]);
    setMileageRange([0, 200000]);
    setSortBy('price-asc');
    setShowOnlyNew(false);
    setShowOnlyHits(false);
    setShowOnlyAvailable(true);
    setCurrentPage(1);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU');
  };

  const totalPages = Math.ceil(totalCars / itemsPerPage);

  // Load favorites and compare list from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
    
    const savedCompare = localStorage.getItem('compare');
    if (savedCompare) {
      setCompareList(new Set(JSON.parse(savedCompare)));
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-secondary text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Каталог автомобилей</h1>
          <p className="text-xl opacity-90">
            {totalCars > 0 ? `${totalCars} автомобилей` : 'Загрузка...'} в нашем каталоге
          </p>
          
          {/* Quick stats */}
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{statistics.total}</div>
                <div className="text-sm opacity-75">Всего автомобилей</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{Object.keys(statistics.byBrand || {}).length}</div>
                <div className="text-sm opacity-75">Марок</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{formatPrice(statistics.averagePrice || 0)} ₽</div>
                <div className="text-sm opacity-75">Средняя цена</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {statistics.priceRange ? `${formatPrice(statistics.priceRange.min)} - ${formatPrice(statistics.priceRange.max)}` : '—'}
                </div>
                <div className="text-sm opacity-75">Диапазон цен</div>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Icon name="Filter" size={20} className="mr-2" />
                    Фильтры
                  </div>
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    <Icon name="RotateCcw" size={16} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Поиск</label>
                  <div className="relative">
                    <Input
                      placeholder="Модель автомобиля..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                    <Icon name="Search" size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                {/* Quick filters */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="new"
                      checked={showOnlyNew}
                      onCheckedChange={setShowOnlyNew}
                    />
                    <label htmlFor="new" className="text-sm">Только новые</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hits"
                      checked={showOnlyHits}
                      onCheckedChange={setShowOnlyHits}
                    />
                    <label htmlFor="hits" className="text-sm">Хиты продаж</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="available"
                      checked={showOnlyAvailable}
                      onCheckedChange={setShowOnlyAvailable}
                    />
                    <label htmlFor="available" className="text-sm">В наличии</label>
                  </div>
                </div>

                {/* Brand Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Марка</label>
                  <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите марку" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все марки</SelectItem>
                      {availableBrands.map(brand => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Тип кузова</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все типы</SelectItem>
                      <SelectItem value="Седан">Седан</SelectItem>
                      <SelectItem value="Кроссовер">Кроссовер</SelectItem>
                      <SelectItem value="Купе">Купе</SelectItem>
                      <SelectItem value="Хэтчбек">Хэтчбек</SelectItem>
                      <SelectItem value="Универсал">Универсал</SelectItem>
                      <SelectItem value="Кабриолет">Кабриолет</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Fuel Type Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Тип топлива</label>
                  <Select value={selectedFuelType} onValueChange={setSelectedFuelType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите топливо" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все типы</SelectItem>
                      <SelectItem value="Бензин">Бензин</SelectItem>
                      <SelectItem value="Дизель">Дизель</SelectItem>
                      <SelectItem value="Гибрид">Гибрид</SelectItem>
                      <SelectItem value="Электро">Электро</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Transmission Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Коробка передач</label>
                  <Select value={selectedTransmission} onValueChange={setSelectedTransmission}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите КПП" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все типы</SelectItem>
                      <SelectItem value="Автомат">Автомат</SelectItem>
                      <SelectItem value="Механика">Механика</SelectItem>
                      <SelectItem value="Робот">Робот</SelectItem>
                      <SelectItem value="Вариатор">Вариатор</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Цена: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])} ₽
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={10000000}
                    min={0}
                    step={100000}
                    className="mt-2"
                  />
                </div>

                {/* Year Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Год: {yearRange[0]} - {yearRange[1]}
                  </label>
                  <Slider
                    value={yearRange}
                    onValueChange={setYearRange}
                    max={2024}
                    min={2000}
                    step={1}
                    className="mt-2"
                  />
                </div>

                {/* Mileage Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Пробег: {formatPrice(mileageRange[0])} - {formatPrice(mileageRange[1])} км
                  </label>
                  <Slider
                    value={mileageRange}
                    onValueChange={setMileageRange}
                    max={300000}
                    min={0}
                    step={5000}
                    className="mt-2"
                  />
                </div>

                {/* Reset Filters */}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={resetFilters}
                >
                  <Icon name="RotateCcw" size={16} className="mr-2" />
                  Сбросить фильтры
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Cars Grid */}
          <div className="lg:col-span-3">
            {/* Sort and Results Count */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-secondary">
                  {loading ? 'Загрузка...' : `Найдено ${totalCars} автомобилей`}
                </h2>
                {compareList.size > 0 && (
                  <div className="mt-2">
                    <Badge variant="outline" className="mr-2">
                      К сравнению: {compareList.size}
                    </Badge>
                    <Button variant="link" size="sm" className="p-0 h-auto">
                      Сравнить
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Вид:</span>
                  <Button variant="outline" size="sm">
                    <Icon name="Grid3X3" size={16} />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Icon name="List" size={16} />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Сортировать:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price-asc">По цене (возрастание)</SelectItem>
                      <SelectItem value="price-desc">По цене (убывание)</SelectItem>
                      <SelectItem value="year-desc">По году (новые)</SelectItem>
                      <SelectItem value="mileage-asc">По пробегу (меньше)</SelectItem>
                      <SelectItem value="name-asc">По названию (А-Я)</SelectItem>
                      <SelectItem value="createdAt-desc">По дате добавления</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <Icon name="AlertCircle" size={48} className="mx-auto text-red-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Ошибка загрузки</h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <Button onClick={() => loadCars(buildFilters)}>
                  <Icon name="RefreshCw" size={16} className="mr-2" />
                  Попробовать снова
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && cars.length === 0 && (
              <div className="text-center py-12">
                <Icon name="Search" size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Автомобили не найдены</h3>
                <p className="text-gray-500 mb-4">Попробуйте изменить параметры поиска</p>
                <Button onClick={resetFilters}>
                  <Icon name="RotateCcw" size={16} className="mr-2" />
                  Сбросить фильтры
                </Button>
              </div>
            )}

            {/* Cars Grid */}
            {!loading && !error && cars.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {cars.map((car) => (
                    <Card key={car._id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                      <div className="relative overflow-hidden">
                        <img 
                          src={car.images[0] || '/placeholder.svg'} 
                          alt={`${car.brand} ${car.model}`}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                          {car.isNew && <Badge className="bg-green-600">Новый</Badge>}
                          {car.isHit && <Badge className="bg-primary">Хит</Badge>}
                          {car.status === 'available' && <Badge className="bg-blue-600">В наличии</Badge>}
                        </div>
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="w-8 h-8 bg-white/80 hover:bg-white"
                            onClick={() => handleToggleFavorite(car._id)}
                          >
                            <Icon 
                              name="Heart" 
                              size={14} 
                              className={favorites.has(car._id) ? 'text-red-500 fill-current' : 'text-gray-600'} 
                            />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="w-8 h-8 bg-white/80 hover:bg-white"
                            onClick={() => handleToggleCompare(car._id)}
                          >
                            <Icon 
                              name="GitCompare" 
                              size={14} 
                              className={compareList.has(car._id) ? 'text-blue-500' : 'text-gray-600'} 
                            />
                          </Button>
                        </div>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-secondary">
                          {car.brand} {car.model}
                        </CardTitle>
                        <div className="text-2xl font-bold text-primary">{formatPrice(car.price)} ₽</div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Icon name="Calendar" size={14} className="mr-1" />
                            {car.year}
                          </div>
                          <div className="flex items-center">
                            <Icon name="Zap" size={14} className="mr-1" />
                            {car.fuelType}
                          </div>
                          <div className="flex items-center">
                            <Icon name="Settings" size={14} className="mr-1" />
                            {car.transmission}
                          </div>
                          <div className="flex items-center">
                            <Icon name="Activity" size={14} className="mr-1" />
                            {formatPrice(car.mileage)} км
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-4">
                          {car.features.slice(0, 2).map((feature, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {car.features.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{car.features.length - 2}
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Link to={`/car/${car._id}`} className="flex-1">
                              <Button className="w-full bg-primary hover:bg-primary/90" size="sm">
                                Подробнее
                              </Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAddToCart(car)}
                              disabled={cartLoading}
                            >
                              <Icon name="ShoppingCart" size={14} />
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Link to="/test-drive" className="flex-1">
                              <Button variant="outline" size="sm" className="w-full">
                                <Icon name="Car" size={14} className="mr-1" />
                                Тест-драйв
                              </Button>
                            </Link>
                            <Link to="/financing" className="flex-1">
                              <Button variant="outline" size="sm" className="w-full">
                                <Icon name="Calculator" size={14} className="mr-1" />
                                Кредит
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                <PaginationComponent
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalCars}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Catalog;