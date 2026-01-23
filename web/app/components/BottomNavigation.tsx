'use client'

interface BottomNavigationProps {
  activeTab: number
  onTabChange: (tab: number) => void
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <div className="bottom-navigation-web">
      <button
        className={`bottom-nav-item-web ${activeTab === 0 ? 'active' : ''}`}
        onClick={() => onTabChange(0)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>Главная</span>
      </button>
      
      <button
        className={`bottom-nav-item-web ${activeTab === 1 ? 'active' : ''}`}
        onClick={() => onTabChange(1)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <span>Корзина</span>
      </button>
      
      <button
        className={`bottom-nav-item-web ${activeTab === 2 ? 'active' : ''}`}
        onClick={() => onTabChange(2)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span>Профиль</span>
      </button>
    </div>
  )
}

