import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, Phone, Mail, Save, ChevronDown } from 'lucide-react';
import { sendMessage, saveConversationToSheet, type ChatMessage } from '../../services/geminiService';

interface ChatBotProps { onClose: () => void; }

function RobotAvatar({ size = 28 }: { size?: number }) {
  return (
    <img src="/SHbot.png" alt="Assistent"
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  );
}

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

function Message({ msg }: { msg: ChatMessage }) {
  const isBot = msg.role === 'model';
  const lines = msg.text.split('\n');
  return (
    <div className={`flex gap-2 ${isBot ? 'items-start' : 'items-end justify-end'}`}>
      {isBot && <RobotAvatar size={28} />}
      <div
        className={['max-w-[82%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed',
          isBot ? 'rounded-tl-sm' : 'rounded-br-sm text-white'].join(' ')}
        style={isBot
          ? { backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }
          : { backgroundColor: '#0ea5e9' }}>
        {lines.map((line, i) => (
          line === '' ? <div key={i} className="h-1.5" /> : <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function ContactForm({ onSave, onSkip }: {
  onSave: (phone: string, email: string) => void; onSkip: () => void;
}) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  return (
    <div className="rounded-2xl border p-4 mx-1 my-2 animate-slide-up"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-base)' }}>
      <p className="text-xs font-semibold text-accent-500 mb-3">
        💾 Deixa les teves dades i en Saïd es posarà en contacte
      </p>
      <div className="flex flex-col gap-2.5">
        <div className="relative">
          <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="tel" placeholder="Telèfon (WhatsApp)" value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-xl border text-sm outline-none focus:border-accent-500"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-input)' }} />
        </div>
        <div className="relative">
          <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="email" placeholder="Correu electrònic" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-xl border text-sm outline-none focus:border-accent-500"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-input)' }} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => onSave(phone, email)} disabled={!phone && !email}
            className="flex-1 h-9 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 transition-colors">
            <Save size={13} /> Enviar dades
          </button>
          <button onClick={onSkip} className="px-3 h-9 rounded-xl border text-xs transition-colors"
            style={{ borderColor: 'var(--border-base)', color: 'var(--text-muted)' }}>
            Ara no
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChatBot({ onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [awaitingName, setAwaitingName] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasGreeted = useRef(false);

  // Salutació inicial — enviem una instrucció clara per disparar la salutació
  useEffect(() => {
    if (hasGreeted.current) return;
    hasGreeted.current = true;
    setLoading(true);
    // Salutació inicial simple — no cal cridar Gemini, és sempre igual
    setTimeout(() => {
      setMessages([{ role: 'model', text: "Hola! 👋 Soc el company virtual d'en Saïd 😊" }]);
      setLoading(false);
    }, 600);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); },
    [messages, loading, showContactForm]);

  // Detectar si cal mostrar el formulari de contacte
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'model' || contactSaved || messages.length < 3) return;
    const text = last.text.toLowerCase();
    // Mostrem el formulari quan el bot menciona dates, contacte, telèfon o correu
    const triggers = [
      'dates', 'disponibilitat', 'telèfon', 'correu', 'contacte',
      'posar-me en contacte', 'enviarte', 'enviar-te', 'pressupost',
      'dades', 'informació addicional'
    ];
    if (triggers.some(t => text.includes(t))) {
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
      // Construïm l'historial per Gemini
      // Si és el PRIMER missatge de l'usuari, afegim context que Gemini ja ha saludat
      const geminiHistory = [...messages].filter(m => m.role === 'user' || m.role === 'model');
      // Traiem els missatges 'model' del principi (generats localment)
      while (geminiHistory.length > 0 && geminiHistory[0].role === 'model') {
        geminiHistory.shift();
      }
      // Si és el primer missatge (historial buit), diem a Gemini que ja ha saludat
      // i que OBLIGATÒRIAMENT ha de demanar el nom abans de res
      const isFirstMessage = geminiHistory.length === 0;
      const textToSend = isFirstMessage
        ? `[CONTEXT: Ja has saludat amb "Hola! Soc el company virtual d'en Saïd". L'usuari acaba d'escriure el seu primer missatge. OBLIGATORI: respon demanant el nom de l'usuari. No presentes opcions ni categories. Només demana el nom.]

Missatge de l'usuari: ${text}`
        : text;
      const reply = await sendMessage(geminiHistory, textToSend);
      setMessages((prev) => [...prev, { role: 'model', text: reply }]);
    } catch (err) {
      console.error('Error enviament:', err);
      setMessages((prev) => [...prev, {
        role: 'model',
        text: 'Ho sento, ha hagut un problema tècnic. Torna-ho a provar en uns moments 🙏',
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, messages]);

  const handleSaveContact = async (phone: string, email: string) => {
    setShowContactForm(false);
    setContactSaved(true);
    const fullChat = messages.map((m) => `${m.role === 'user' ? (userName || 'Client') : 'Assistent'}: ${m.text}`).join('\n---\n');
    const userText = messages.filter((m) => m.role === 'user').map((m) => m.text).join(' ').toLowerCase();
    const keywords = ['excel', 'word', 'powerpoint', 'access', 'outlook', 'actic', 'ia ', 'cloud', 'microsoft', 'consultoria'];
    const coursesFound = keywords.filter((k) => userText.includes(k)).join(', ') || 'No especificats';
    await saveConversationToSheet({
      phone: phone || '—',
      email: email || '—',
      summary: `Nom: ${userName || 'desconegut'}. ${userText.slice(0, 300)}`,
      courses: coursesFound,
      fullChat,
    });
    setMessages((prev) => [...prev, {
      role: 'model',
      text: `Perfecte, ${userName ? userName + '!' : ''} ✅ He guardat les teves dades.\n\nEn Saïd es posarà en contacte amb tu molt aviat per confirmar disponibilitat i dates 😊\n\nGràcies per confiar en SHformacions!`,
    }]);
  };

  return (
    <div className="fixed z-[60] flex flex-col shadow-2xl border overflow-hidden transition-all duration-300"
      style={{
        bottom: 88, right: 16,
        width: 'min(360px, calc(100vw - 32px))',
        height: isMinimized ? 52 : 'min(520px, calc(100vh - 120px))',
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-strong)',
        borderRadius: 20,
      }}>

      {/* Capçalera */}
      <div className="flex items-center gap-2.5 px-4 h-[52px] flex-shrink-0 cursor-pointer"
        style={{ background: 'linear-gradient(135deg, #0ea5e9, #0369a1)' }}
        onClick={() => setIsMinimized(!isMinimized)}>
        <RobotAvatar size={32} />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold leading-none">Assistent Virtual</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <p className="text-white/70 text-[10px]">SHformacions · En línia</p>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/80">
          <ChevronDown size={16} className={`transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
        </button>
        <button onClick={(e) => {
            e.stopPropagation();
            // Guardem la conversa al tancar si hi ha missatges
            if (messages.length > 1) {
              const fullChat = messages.map((m) =>
                `${m.role === 'user' ? 'Client' : 'Assistent'}: ${m.text}`
              ).join('\n---\n');
              const userText = messages.filter(m => m.role === 'user').map(m => m.text).join(' ').toLowerCase();
              const keywords = ['excel','word','powerpoint','access','outlook','actic','ia ','cloud','microsoft','consultoria'];
              const coursesFound = keywords.filter(k => userText.includes(k)).join(', ') || 'No especificats';
              saveConversationToSheet({
                phone: '—',
                email: '—',
                summary: `Nom: ${userName || 'desconegut'}. ${userText.slice(0, 300)}`,
                courses: coursesFound,
                fullChat,
              });
            }
            onClose();
          }}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-white">
          <X size={15} />
        </button>
      </div>

      {!isMinimized && (
        <>
          {/* Missatges */}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            {loading && (
              <div className="flex gap-2 items-start">
                <RobotAvatar size={28} />
                <TypingDots />
              </div>
            )}
            {showContactForm && !contactSaved && (
              <ContactForm onSave={handleSaveContact} onSkip={() => setShowContactForm(false)} />
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-t flex-shrink-0"
            style={{ borderColor: 'var(--border-base)' }}>
            <input ref={inputRef} type="text" value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Escriu un missatge..."
              className="flex-1 h-9 px-3 rounded-xl border text-sm outline-none focus:border-accent-500 transition-colors"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-input)' }}
              disabled={loading} />
            <button onClick={handleSend} disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0">
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
