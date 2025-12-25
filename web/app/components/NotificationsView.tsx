'use client'

export default function NotificationsView() {
  const notifications = [
    { id: 1, title: 'Новое предложение', message: 'Скидка 20% на все роллы!', time: '10 минут назад', unread: true },
    { id: 2, title: 'Заказ готов', message: 'Ваш заказ готов к доставке', time: '1 час назад', unread: true },
    { id: 3, title: 'Новое меню', message: 'Добавлены новые позиции в меню', time: '2 часа назад', unread: false },
  ]

  return (
    <div className="full-page-content-web">
      <div className="page-content-inner-web">
        <div className="notifications-list-web">
          {notifications.map(notification => (
            <div key={notification.id} className={`notification-item-web ${notification.unread ? 'unread' : ''}`}>
              <div className="notification-icon-web">🔔</div>
              <div className="notification-content-web">
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                <span className="notification-time-web">{notification.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
