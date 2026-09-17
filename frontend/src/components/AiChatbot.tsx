import { FormEvent, useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';
import { Language, t } from '../data/translations';

type Message = { id: number; sender: 'assistant' | 'user'; text: string };

function getReply(language: Language, value: string) {
  const question = value.toLowerCase();
  if (question.includes('rent') || question.includes('kodesh') || question.includes('kod')) return t(language, 'For renting, start with your preferred location and budget. I can help you compare suitable homes.');
  if (question.includes('buy') || question.includes('gura') || question.includes('nunua')) return t(language, 'For buying, begin with the area, property type, and budget that fit your plans.');
  if (question.includes('sell') || question.includes('gurish') || question.includes('uza')) return t(language, 'To sell or list a property, prepare the location, price, photos, and key details for interested buyers.');
  if (question.includes('kigali') || question.includes('location') || question.includes('where')) return t(language, 'You can search by Kigali, province, and property type using the search panel above.');
  return t(language, 'I can help with renting, buying, selling, locations, and property types. What would you like to explore?');
}

export function AiChatbot({ language }: { language: Language }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ id: 1, sender: 'assistant', text: t(language, 'Hello! I can help you find a place in Rwanda. Ask me about renting, buying, locations, or property types.') }]);
  const chatbotRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (open && chatbotRef.current && !chatbotRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [open]);

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setMessages((current) => [...current, { id: Date.now(), sender: 'user', text: trimmed }, { id: Date.now() + 1, sender: 'assistant', text: getReply(language, trimmed) }]);
    setValue('');
  };

  return <aside ref={chatbotRef} className={`ai-chatbot ${open ? 'is-open' : ''}`} aria-label={t(language, 'Umutungo AI assistant')}>
    {open && <div className="ai-chat-panel"><div className="ai-chat-header"><div><strong>{t(language, 'Umutungo Assistant')}</strong><small>{t(language, 'Here to make the search easier')}</small></div><button type="button" aria-label={t(language, 'Close chat')} onClick={() => setOpen(false)}><Icon name="x" size={17} /></button></div><div className="ai-chat-messages" aria-live="polite">{messages.map((message) => <div className={`ai-chat-message ${message.sender}`} key={message.id}>{message.text}</div>)}</div><form className="ai-chat-form" onSubmit={sendMessage}><input value={value} onChange={(event) => setValue(event.target.value)} placeholder={t(language, 'Ask Umutungo AI...')} aria-label={t(language, 'Ask Umutungo AI')} /><button type="submit" aria-label={t(language, 'Send message')}><Icon name="arrow" size={15} /></button></form></div>}
    {!open && <button className="ai-chat-toggle" type="button" onClick={() => setOpen(true)} aria-label={t(language, 'Open chat')}><Icon name="sparkles" size={19} /><span>{t(language, 'Ask Umutungo AI')}</span></button>}
  </aside>;
}
