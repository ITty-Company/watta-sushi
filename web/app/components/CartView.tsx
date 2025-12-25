'use client'

import { useState, useEffect } from 'react'

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  category: string
  emoji: string
}

export default function CartView() {
  const [cartItems, setCartItems] = useState<MenuItem[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      setCartItems(cart)
    }
  }, [])

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0)

  const handleOrder = () => {
    alert('Заказ оформлен!')
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('cart')
    }
    setCartItems([])
  }

  return (
    <div className="full-page-web">
      <div className="full-page-header-web">
        <h1 className="full-page-title-web">Корзина</h1>
      </div>
      <div className="full-page-content-web">
        <div className="page-content-inner-web">
      {cartItems.length === 0 ? (
        <div className="cart-empty">
          <div className="cart-empty-icon">🛒</div>
          <div className="cart-empty-text">Корзина пуста</div>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map((item, index) => (
              <div key={`${item.id}-${index}`} className="cart-item">
                <span className="cart-item-emoji">{item.emoji}</span>
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">{item.price} ₽</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="cart-summary">
            <div className="cart-total">
              <span className="cart-total-label">Итого:</span>
              <span className="cart-total-price">{totalPrice} ₽</span>
            </div>
            <button className="order-button" onClick={handleOrder}>
              Оформить заказ
            </button>
          </div>
        </>
      )}
        </div>
      </div>
    </div>
  )
}

