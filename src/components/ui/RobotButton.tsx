import React, { useState } from 'react';
import { ChatBot } from './ChatBot';

export function RobotButton() {
  const [chatOpen, setChatOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <>
      {/* ── Xat ── */}
      {chatOpen && <ChatBot onClose={() => setChatOpen(false)} />}

      {/* ── Botó robot flotant ── */}
      <div className="fixed bottom-20 right-3 z-50 flex flex-col items-end gap-2">

        {/* Bombolla text hover (quan xat tancat) */}
        {hovered && !chatOpen && (
          <div className="relative animate-slide-up bg-[#1a1a1a] border border-accent-500/40 text-white text-xs rounded-2xl rounded-br-sm px-3 py-2 shadow-xl max-w-[150px] text-center leading-snug pointer-events-none">
            Hola! 👋 Et puc ajudar?
            <div className="absolute bottom-[-5px] right-4 w-2.5 h-2.5 bg-[#1a1a1a] border-r border-b border-accent-500/40"
              style={{ transform: 'rotate(45deg)' }} />
          </div>
        )}

        <button
          onClick={() => setChatOpen(!chatOpen)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          aria-label="Obrir assistent virtual"
          className="relative w-16 h-20 focus:outline-none"
          style={{ background: 'none', border: 'none', padding: 0 }}
        >
          {/* Ombra */}
          <div className={[
            'absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-3 rounded-full blur-md transition-all duration-300',
            hovered || chatOpen ? 'bg-accent-400/50 scale-110' : 'bg-accent-400/20',
          ].join(' ')} />

          {/* Robot */}
          <img
            src="/robot-full.png"
            alt="Assistent Virtual SHformacions"
            className="w-full h-full object-contain drop-shadow-lg"
            draggable={false}
            style={{
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: (hovered || chatOpen)
                ? 'translateY(-6px) scale(1.08) rotate(-3deg)'
                : 'translateY(0) scale(1) rotate(0deg)',
              filter: 'drop-shadow(0 4px 12px rgba(14, 165, 233, 0.3))',
            }}
          />

          {/* Badge verd WhatsApp → ara és un punt verd "en línia" */}
          <div className={[
            'absolute bottom-2 right-0 w-4 h-4 rounded-full border-2 border-[#080808] transition-colors',
            chatOpen ? 'bg-green-400' : 'bg-accent-500',
          ].join(' ')} />
        </button>
      </div>
    </>
  );
}
