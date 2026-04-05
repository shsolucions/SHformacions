import React, { useState } from 'react';
import { ChatBot } from './ChatBot';

export function RobotButton() {
  const [chatOpen, setChatOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <>
      {chatOpen && <ChatBot onClose={() => setChatOpen(false)} />}
      <div className="fixed bottom-20 right-3 z-50 flex flex-col items-end gap-2">

        {/* Bombolla de text */}
        {hovered && !chatOpen && (
          <div className="relative animate-slide-up text-xs rounded-2xl rounded-br-sm px-3 py-2 shadow-xl max-w-[160px] text-center leading-snug pointer-events-none border"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}>
            Hola! 👋 Et puc ajudar?
            <div className="absolute bottom-[-5px] right-4 w-2.5 h-2.5 border-r border-b rotate-45"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-strong)' }} />
          </div>
        )}

        {/* Botó SHbot — imatge circular */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          aria-label="Obrir assistent virtual"
          className="relative focus:outline-none"
        >
          {/* Anell animat quan el xat és obert */}
          {chatOpen && (
            <span className="absolute inset-0 rounded-full border-2 border-accent-400 animate-ping opacity-50" />
          )}

          {/* SHbot circular */}
          <div
            className="relative w-14 h-14 rounded-full overflow-hidden shadow-xl border-2 transition-all duration-300"
            style={{
              borderColor: chatOpen ? '#0ea5e9' : 'rgba(14,165,233,0.4)',
              transform: (hovered || chatOpen) ? 'scale(1.08)' : 'scale(1)',
              boxShadow: (hovered || chatOpen)
                ? '0 0 20px rgba(14,165,233,0.5)'
                : '0 4px 15px rgba(0,0,0,0.3)',
            }}
          >
            <img
              src="/SHbot.png"
              alt="Assistent Virtual SHformacions"
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>

          {/* Punt verd "en línia" */}
          <span
            className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
            style={{ backgroundColor: chatOpen ? '#22c55e' : '#0ea5e9' }}
          />
        </button>
      </div>
    </>
  );
}
