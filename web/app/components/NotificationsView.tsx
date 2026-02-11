import React from 'react';
import { X, Bell } from 'lucide-react';

// ВАЖНО: Используем export const, чтобы совпадало с import { NotificationsView }
export const NotificationsView = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  
  // Если меню закрыто и анимация не нужна (или простая проверка), можно не рендерить
  // Но для анимации лучше управлять классами. 
  // Если в твоем MenuView компонент рендерится условно (&&), то этот блок не нужен.
  // Если он рендерится всегда, но скрыт - оставляем логику ниже.
  
  return (
    <>
      {/* 1. Фон (Backdrop) - показываем только если isOpen */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        onClick={onClose} 
      />

      {/* 2. Сама панель */}
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

          {/* Контент: Пустое состояние */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="relative mb-6">
              <Bell size={64} className="text-gray-400" strokeWidth={1.5} />
              <div className="absolute -top-1 -right-1 bg-white rounded-full p-1">
                 <X size={20} className="text-orange-500 bg-white rounded-full border border-white" /> 
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Повідомлень немає
            </h3>
            <p className="text-gray-500 max-w-[250px]">
              Ми повідомимо, коли з'явиться щось цікаве
            </p>
          </div>
        </div>
      </div>
    </>
  );
};