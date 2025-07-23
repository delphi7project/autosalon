import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import Icon from '@/components/ui/icon';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { getCartItemsCount } = useCart();

  const navigation = [
    { name: 'Главная', href: '/' },
    { name: 'Каталог', href: '/catalog' },
    { name: 'Сервис', href: '/service' },
    { name: 'Trade-in', href: '/trade-in' },
    { name: 'Кредит', href: '/financing' },
    { name: 'Страхование', href: '/insurance' },
    { name: 'Корзина', href: '/cart' },
    { name: 'О нас', href: '/about' },
    { name: 'Контакты', href: '/contacts' }
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Icon name="Car" size={32} className="text-primary" />
            <span className="text-2xl font-bold text-secondary">AutoPremium</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(item.href) ? 'text-primary' : 'text-foreground'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Contact Button */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium">+7 (495) 123-45-67</div>
              <div className="text-xs text-gray-500">Ежедневно 9:00-21:00</div>
            </div>
            <Link to="/cart" className="relative">
              <Button variant="outline" size="icon">
                <Icon name="ShoppingCart" size={16} />
                {getCartItemsCount() > 0 && (
                  <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs bg-primary">
                    {getCartItemsCount()}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link to="/contacts">
              <Button className="bg-primary hover:bg-primary/90">
                <Icon name="Phone" size={16} className="mr-2" />
                Связаться
              </Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Icon name="Menu" size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col h-full">
                <div className="flex items-center space-x-2 mb-8">
                  <Icon name="Car" size={24} className="text-primary" />
                  <span className="text-xl font-bold text-secondary">AutoPremium</span>
                </div>

                <nav className="flex-1">
                  <div className="space-y-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`block py-2 px-3 rounded-lg transition-colors ${
                          isActive(item.href)
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground hover:bg-gray-100'
                        }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </nav>

                <div className="border-t pt-6 mt-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="font-medium">+7 (495) 123-45-67</div>
                      <div className="text-sm text-gray-500">Ежедневно 9:00-21:00</div>
                    </div>
                    <Link to="/cart" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full">
                        <Icon name="ShoppingCart" size={16} className="mr-2" />
                        Корзина {getCartItemsCount() > 0 && `(${getCartItemsCount()})`}
                      </Button>
                    </Link>
                    <Link to="/contacts" onClick={() => setIsOpen(false)}>
                      <Button className="w-full bg-primary hover:bg-primary/90">
                        <Icon name="Phone" size={16} className="mr-2" />
                        Связаться
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;