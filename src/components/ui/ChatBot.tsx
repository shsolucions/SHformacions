import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, Phone, Mail, Save, ChevronDown } from 'lucide-react';
import { sendMessage, saveConversationToSheet, type ChatMessage } from '../../services/geminiService';

interface ChatBotProps {
  onClose: () => void;
}

// ── Robot Avatar ─────────────────────────────────────────────────────────────
function RobotAvatar({ size = 28 }: { size?: number }) {
  return (
    <img
      src="/robot-icon.png"
      alt="Assistent"
      style={{ width: size, height: size, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
    />
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5 rounded-2xl rounded-bl-sm"
      style={{ backgroundColor: 'var(--bg-elevated)', display: 'inline-flex' }}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}

// ── Missatge individual ──────────────────────────────────────────────────────
function Message({ msg }: { msg: ChatMessage }) {
  const isBot = msg.role === 'model';

  // Formatem el text: salts de línia i emojis
  const lines = msg.text.split('\n').filter((l, i, arr) => !(l === '' && arr[i - 1] === ''));

  return (
    <div className={`flex gap-2 ${isBot ? 'items-start' : 'items-end justify-end'}`}>
      {isBot && <RobotAvatar size={26} />}
      <div
        className={[
          'max-w-[82%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed',
          isBot
            ? 'rounded-tl-sm'
            : 'rounded-br-sm text-white',
        ].join(' ')}
        style={isBot
          ? { backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }
          : { backgroundColor: '#0ea5e9' }}
      >
        {lines.map((line, i) => (
          <p key={i} className={line === '' ? 'h-2' : ''}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

// ── Formulari de dades de contacte ───────────────────────────────────────────
function ContactForm({ onSave, onSkip }: {
  onSave: (phone: string, email: string) => void;
  onSkip: () => void;
}) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  return (
    <div className="rounded-2xl border p-4 mx-1 my-2 animate-slide-up"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-base)' }}>
      <p className="text-xs font-semibold text-accent-500 mb-3">
        💾 Guarda les teves dades per rebre el pressupost
      </p>
      <div className="flex flex-col gap-2.5">
        <div className="relative">
          <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="tel"
            placeholder="Telèfon (WhatsApp)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-xl border text-sm outline-none focus:border-accent-500"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-input)' }}
          />
        </div>
        <div className="relative">
          <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            placeholder="Correu electrònic"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-xl border text-sm outline-none focus:border-accent-500"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-input)' }}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSave(phone, email)}
            disabled={!phone && !email}
            className="flex-1 h-9 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 transition-colors"
          >
            <Save size={13} /> Enviar dades
          </button>
          <button onClick={onSkip}
            className="px-3 h-9 rounded-xl border text-xs transition-colors"
            style={{ borderColor: 'var(--border-base)', color: 'var(--text-muted)' }}>
            Ara no
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Component principal del xat ──────────────────────────────────────────────
export function ChatBot({ onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasGreeted = useRef(false);

  // Salutació inicial automàtica
  useEffect(() => {
    if (hasGreeted.current) return;
    hasGreeted.current = true;
    setLoading(true);
    sendMessage([], '.')
      .then((text) => {
        setMessages([{ role: 'model', text }]);
      })
      .catch(() => {
        setMessages([{
          role: 'model',
          text: "Hola! 👋 Soc el treballador virtual d'en Saïd 😊\n\nEn aquest moment tinc problemes de connexió. Pots contactar-nos directament per WhatsApp i t'ajudarem encantats!",
        }]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Scroll automàtic a baix
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, showContactForm]);

  // Detectar si el bot ha demanat dades de contacte
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'model' || contactSaved) return;
    const text = last.text.toLowerCase();
    if (
      (text.includes('telèfon') || text.includes('correu') || text.includes('dades')) &&
      text.includes('pressupost') && messages.length > 3
    ) {
      setTimeout(() => setShowContactForm(true), 800);
    }
  }, [messages, contactSaved]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setShowContactForm(false);

    const userMsg: ChatMessage = { role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const reply = await sendMessage(messages, text);
      setMessages((prev) => [...prev, { role: 'model', text: reply }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: 'model',
        text: 'Ho sento, ha hagut un problema. Prova de nou o contacta\'ns per WhatsApp 😊',
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, messages]);

  const handleSaveContact = async (phone: string, email: string) => {
    setShowContactForm(false);
    setContactSaved(true);

    // Resum de la conversa per al Google Sheet
    const fullChat = messages
      .map((m) => `${m.role === 'user' ? 'Client' : 'Assistent'}: ${m.text}`)
      .join('\n---\n');

    const userMessages = messages.filter((m) => m.role === 'user').map((m) => m.text).join(' ');
    const courseKeywords = ['excel', 'word', 'powerpoint', 'access', 'outlook', 'actic', 'ia ', 'cloud', 'microsoft 365', 'consultoria'];
    const coursesFound = courseKeywords
      .filter((k) => userMessages.toLowerCase().includes(k))
      .join(', ');

    await saveConversationToSheet({
      phone: phone || '—',
      email: email || '—',
      summary: userMessages.slice(0, 300),
      courses: coursesFound || 'No especificats',
      fullChat,
    });

    setMessages((prev) => [...prev, {
      role: 'model',
      text: `Perfecte! ✅ He guardat les teves dades.\n\nEn Saïd es posarà en contacte amb tu aviat per confirmar disponibilitat i dates 😊\n\nMoltes gràcies per la teva confiança en SHformacions!`,
    }]);
  };

  return (
    <div
      className="fixed z-[60] flex flex-col shadow-2xl border overflow-hidden transition-all duration-300"
      style={{
        bottom: 88,
        right: 16,
        width: 'min(360px, calc(100vw - 32px))',
        height: isMinimized ? 52 : 'min(520px, calc(100vh - 120px))',
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-strong)',
        borderRadius: 20,
      }}
    >
      {/* ── Capçalera ── */}
      <div
        className="flex items-center gap-2.5 px-4 h-[52px] flex-shrink-0 cursor-pointer"
        style={{ background: 'linear-gradient(135deg, #0ea5e9, #0369a1)' }}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <RobotAvatar size={30} />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold leading-none">Assistent Virtual</p>
          <p className="text-white/70 text-[10px] mt-0.5">SHformacions · En línia</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/80"
          >
            <ChevronDown size={16} className={`transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* ── Missatges ── */}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} />
            ))}
            {loading && (
              <div className="flex gap-2 items-start">
                <RobotAvatar size={26} />
                <TypingDots />
              </div>
            )}
            {showContactForm && !contactSaved && (
              <ContactForm
                onSave={handleSaveContact}
                onSkip={() => setShowContactForm(false)}
              />
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── Input ── */}
          <div
            className="flex items-center gap-2 px-3 py-2.5 border-t flex-shrink-0"
            style={{ borderColor: 'var(--border-base)' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Escriu un missatge..."
              className="flex-1 h-9 px-3 rounded-xl border text-sm outline-none focus:border-accent-500 transition-colors"
              style={{
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-input)',
              }}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0"
            >
              {loading
                ? <Loader2 size={15} className="text-white animate-spin" />
                : <Send size={15} className="text-white" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
