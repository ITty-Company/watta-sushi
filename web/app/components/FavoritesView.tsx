'use client'

export default function FavoritesView() {
  const favorites = [
    { id: 1, name: 'Філадельфія', description: 'Лосось, сир, огірок', price: 450, emoji: '🍣' },
    { id: 2, name: 'Каліфорнія', description: 'Краб, авокадо, огірок', price: 380, emoji: '🍱' },
    { id: 3, name: 'Місо суп', description: 'Традиційний японський суп', price: 180, emoji: '🍲' },
  ]

  return (
    <div className="full-page-content-web">
      <div className="page-content-inner-web">
        <div className="favorites-list-web">
          {favorites.map(item => (
            <div key={item.id} className="favorite-item-web">
              <div className="favorite-emoji-web">{item.emoji}</div>
              <div className="favorite-info-web">
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <span className="favorite-price-web">{item.price} ₴</span>
              </div>
              <button className="favorite-remove-btn-web">×</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
