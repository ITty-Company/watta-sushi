'use client'

import LogoBackground from './LogoBackground'

export default function PhoneView() {
  return (
    <div className="full-page-content-web relative">
      <LogoBackground />
      <div className="relative z-10">
      <div className="page-content-inner-web">
        <div className="contact-item-web">
          <div className="contact-icon-web">📞</div>
          <div className="contact-info-web">
            <h3>Телефон</h3>
            <p>+380 (50) 123-45-67</p>
          </div>
        </div>
        <div className="contact-item-web">
          <div className="contact-icon-web">📱</div>
          <div className="contact-info-web">
            <h3>Мобильный</h3>
            <p>+380 (67) 987-65-43</p>
          </div>
        </div>
        <div className="contact-item-web">
          <div className="contact-icon-web">✉️</div>
          <div className="contact-info-web">
            <h3>Email</h3>
            <p>info@wattasushi.com</p>
          </div>
        </div>
        <button className="contact-call-btn-web">Позвонить</button>
      </div>
      </div>
    </div>
  )
}
