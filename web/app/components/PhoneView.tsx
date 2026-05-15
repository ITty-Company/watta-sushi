'use client'

import LogoBackground from './LogoBackground'
import { WATTA_INSTAGRAM_URL } from '@/lib/wattaSiteDefaults'

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
            <p>+31649326549</p>
          </div>
        </div>
        <div className="contact-item-web">
          <div className="contact-icon-web">💬</div>
          <div className="contact-info-web">
            <h3>Telegram</h3>
            <a
              href="https://t.me/example"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#145142', fontWeight: 700 }}
            >
              t.me/example
            </a>
          </div>
        </div>
        <div className="contact-item-web">
          <div className="contact-icon-web">🟢</div>
          <div className="contact-info-web">
            <h3>WhatsApp</h3>
            <a
              href="https://wa.me/12345"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#145142', fontWeight: 700 }}
            >
              wa.me/12345
            </a>
          </div>
        </div>
        <div className="contact-item-web">
          <div className="contact-icon-web">📸</div>
          <div className="contact-info-web">
            <h3>Instagram</h3>
            <a
              href={WATTA_INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#145142', fontWeight: 700 }}
            >
              @watta_sushi
            </a>
          </div>
        </div>
        <div className="contact-item-web">
          <div className="contact-icon-web">✉️</div>
          <div className="contact-info-web">
            <h3>Email</h3>
            <p>info@wattasushi.com</p>
          </div>
        </div>
        <a className="contact-call-btn-web" href="tel:+31649326549">
          Позвонить
        </a>
      </div>
      </div>
    </div>
  )
}
