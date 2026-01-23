'use client'; // <--- ВАЖНО для Next.js (компонент с интерактивностью)

import { ShoppingBag, User, Menu as MenuIcon } from 'lucide-react';
import Link from 'next/link';       // Вместо react-router-dom
import { useRouter } from 'next/navigation'; // Вместо react-router-dom
import { useEffect, useState } from 'react';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
}

export function Header({ cartCount, onOpenCart }: HeaderProps) {
  const router = useRouter(); // Хук роутера Next.js
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Проверяем логин только на клиенте (чтобы избежать ошибок гидратации)
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        
        {/* Логотип */}
        <div className="flex items-center gap-2">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            Sushi <span className="text-pink-500">Watta</span>
          </Link>
        </div>

        {/* Навигация */}
        <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-600">
          <Link href="/" className="hover:text-pink-500 transition">Меню</Link>
          <Link href="/delivery" className="hover:text-pink-500 transition">Доставка</Link>
          <Link href="/blog" className="hover:text-pink-500 transition">Блог</Link>
        </nav>

        {/* Иконки */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push(isLoggedIn ? '/profile' : '/login')}
            className="rounded-full p-2 text-gray-600 transition hover:bg-gray-100 hover:text-pink-500"
          >
            <User size={24} />
          </button>
          
          <button 
            onClick={onOpenCart}
            className="relative rounded-full p-2 text-gray-600 transition hover:bg-gray-100 hover:text-pink-500"
          >
            <ShoppingBag size={24} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}