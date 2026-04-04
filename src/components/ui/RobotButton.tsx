import React, { useState } from 'react';
import { whatsappService } from '../../services/whatsappService';
import { useTranslation } from '../../context/LanguageContext';

export function RobotButton() {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    whatsappService.openGeneral(t('whatsapp.message'));
  };

  return (
    <div className="fixed bottom-20 right-3 z-50 flex flex-col items-end gap-2">

      {/* Bombolla de text que apareix en hover */}
      {hovered && (
        <div className="relative animate-slide-up bg-[#1a1a1a] border border-accent-500/40 text-white text-xs rounded-2xl rounded-br-sm px-3 py-2 shadow-xl max-w-[150px] text-center leading-snug pointer-events-none">
          Hola! 👋 Et puc ajudar?
          <div
            className="absolute bottom-[-5px] right-4 w-2.5 h-2.5 bg-[#1a1a1a] border-r border-b border-accent-500/40 rotate-45"
            style={{ transform: 'rotate(45deg)' }}
          />
        </div>
      )}

      {/* Botó del robot — imatge sense fons */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={() => setHovered(true)}
        onTouchEnd={() => setTimeout(() => setHovered(false), 2000)}
        aria-label={t('whatsapp.contact')}
        title={t('whatsapp.contact')}
        className="relative w-16 h-20 focus:outline-none"
        style={{ background: 'none', border: 'none', padding: 0 }}
      >
        {/* Ombra brillant sota el robot */}
        <div
          className={[
            'absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-3 rounded-full blur-md transition-all duration-300',
            hovered ? 'bg-accent-400/50 scale-110' : 'bg-accent-400/20',
          ].join(' ')}
        />

        {/* Imatge del robot de cos sencer, sense fons */}
        <img
          src="/robot-full.png"
          alt="SH Robot"
          className="w-full h-full object-contain drop-shadow-lg"
          draggable={false}
          style={{
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: hovered
              ? 'translateY(-6px) scale(1.08) rotate(-3deg)'
              : 'translateY(0) scale(1) rotate(0deg)',
            filter: 'drop-shadow(0 4px 12px rgba(14, 165, 233, 0.3))',
          }}
        />

        {/* Badge verd de WhatsApp */}
        <div className="absolute bottom-2 right-0 w-5 h-5 rounded-full bg-[#25D366] flex items-center justify-center shadow-md border border-[#1a1a1a]">
          <svg viewBox="0 0 24 24" width="11" height="11" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        </div>
      </button>
    </div>
  );
}
