import React from 'react';
import { X, Bell } from '@/lib/wattaInlineIcons' // Или твои иконки

interface NotificationsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsSidebar: React.FC<NotificationsSidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* 1. Затемнение фона (Backdrop) */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose} // Закрываем при клике на фон
      />

      {/* 2. Сама боковая панель */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          
          {/* Шапка */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900">Повідомлення</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-500" />
            </button>
          </div>

          {/* Контент (Пустое состояние как на фото) */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            
            {/* Иконка колокольчика с крестиком */}
            <div className="relative mb-6">
              <Bell size={64} className="text-gray-400" strokeWidth={1.5} />
              <div className="absolute -top-1 -right-1 bg-white rounded-full p-1">
                 <X size={20} className="text-orange-500 bg-white rounded-full border border-white" /> 
                 {/* Или просто красный крестик поверх */}
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Повідомлень немає
            </h3>
            <p className="text-gray-500 max-w-[250px]">
              Ми повідомимо, коли з&apos;явиться щось цікаве
            </p>
          </div>

          {/* Можно добавить футер или кнопку внизу, если нужно */}
        </div>
      </div>
    </>
  );
};

export default NotificationsSidebar;