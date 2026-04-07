import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto pb-20 md:pb-8">
      <div className="max-w-[1800px] mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-[#145142] font-black text-2xl tracking-tight">Watta Sushi</h3>
            <p className="text-gray-500 text-sm mt-1">Доставка найсмачніших суші</p>
          </div>
          
          <div className="flex gap-6 text-sm text-gray-600 font-medium">
            <Link href="/menu" className="hover:text-[#ff6b35] transition">Меню</Link>
            <Link href="/delivery" className="hover:text-[#ff6b35] transition">Доставка</Link>
            <Link href="/blog" className="hover:text-[#ff6b35] transition">Блог</Link>
            <Link href="/about" className="hover:text-[#ff6b35] transition">Про нас</Link>
          </div>

          <div className="text-sm text-gray-400" suppressHydrationWarning>
            © {new Date().getFullYear()} Watta Sushi. Всі права захищені.
          </div>
        </div>
      </div>
    </footer>
  );
}