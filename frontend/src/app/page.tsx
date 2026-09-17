'use client';

import { useEffect, useState } from 'react';
import { AiChatbot } from '../components/AiChatbot';
import { Footer } from '../components/Footer';
import { Icon } from '../components/Icons';
import { Navbar } from '../components/Navbar';
import { PropertyCard, PropertyPlaceholder } from '../components/PropertyCard';
import { PropertySearch } from '../components/PropertySearch';
import { ReviewPanel } from '../components/ReviewPanel';
import { Language, t } from '../data/translations';

const propertyPlaceholders: PropertyPlaceholder[] = [
  { id: 'home', title: 'Demo family home', type: 'House', location: 'Gisozi · Kigali', price: 'RWF 1,250,000', priceNote: '/ month', bedrooms: 4, bathrooms: 3, area: 220, accent: '#08a650', image: '/og1.png' },
  { id: 'space', title: 'Demo garden home', type: 'House', location: 'Kicukiro · Kigali', price: 'RWF 950,000', priceNote: '/ month', bedrooms: 3, bathrooms: 2, area: 160, accent: '#111412', image: '/og2.png' },
  { id: 'opportunity', title: 'Demo Nyarutarama residence', type: 'House', location: 'Nyarutarama · Kigali', price: 'RWF 2,400,000', priceNote: '/ month', bedrooms: 5, bathrooms: 4, area: 310, accent: '#6d8d6f', image: '/og3.png' },
];

export default function HomePage() {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('English');
  const [location, setLocation] = useState('Kigali');
  const [type, setType] = useState('Any type');
  const [intent, setIntent] = useState('Buy or rent');
  const [searchMessage, setSearchMessage] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const copy = (key: string) => t(language, key);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('umutungo-theme');
    if (savedTheme === 'dark') setDarkMode(true);
  }, []);

  useEffect(() => {
    const localeMap: Record<string, string> = { English: 'en', French: 'fr', Kinyarwanda: 'rw', Swahili: 'sw' };
    document.documentElement.lang = localeMap[language] ?? 'en';
  }, [language]);

  const toggleTheme = () => { setDarkMode((current) => { const next = !current; window.localStorage.setItem('umutungo-theme', next ? 'dark' : 'light'); return next; }); };
  const submitSearch = () => { setSearchMessage(copy("We'll keep your {intent} search in {location} ready for the first verified listings.").replace('{intent}', copy(intent)).replace('{location}', copy(location))); document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const toggleFavorite = (id: string) => setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  return <div className={darkMode ? 'app theme-dark' : 'app'}>
    <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} language={language} onLanguageChange={setLanguage} />
    <AiChatbot language={language} />
    <main>
      <section className="hero-section" id="home"><div className="hero-image"><div className="hero-image-overlay" /><div className="container hero-content"><div className="hero-copy"><h1>{copy('Find where')}<br /><em>{copy('you belong.')}</em></h1><p className="hero-lead">{copy('We are here for everyone who wants a place to live - the easy, trusted and comfortable way.')}</p><div className="hero-actions"><a className="button button-primary" href="#properties">{copy('Explore spaces')} <Icon name="arrow" size={16} /></a><a className="hero-text-link" href="#post-property">{copy('Become an agent')} <Icon name="arrow" size={16} /></a></div></div></div></div><div className="container hero-search-wrap"><PropertySearch language={language} location={location} type={type} intent={intent} onLocationChange={setLocation} onTypeChange={setType} onIntentChange={setIntent} onSubmit={submitSearch} /></div></section>

      <section className="section section-property container" id="properties"><div className="section-heading split-heading"><div><p className="eyebrow">{copy('A place for every story')}</p><h2>{copy('Places that are special to you are right here,')}<br /><em>{copy('and we are here to make things easier.')}</em></h2></div><p className="section-description">{copy('A calm, clear starting point for discovering the homes, spaces and opportunities waiting for you.')}</p></div>{searchMessage && <div className="search-feedback" role="status"><Icon name="check" size={16} /> {searchMessage}</div>}<div className="property-grid">{propertyPlaceholders.map((property) => <PropertyCard key={property.id} language={language} property={property} favorite={favorites.includes(property.id)} onFavorite={() => toggleFavorite(property.id)} onView={() => setSearchMessage(`${copy(property.title)} ${copy('is a demo listing. Live property details will appear here once listings are connected.')}`)} />)}</div><p className="placeholder-note"><span /> {copy('Sample Rwandan homes shown for layout demonstration. Live verified inventory will connect here later.')}</p></section>

      <section className="trust-section section container" id="how-it-works"><div className="section-heading centered-heading"><p className="eyebrow">{copy('The Umutungo promise')}</p><h2>{copy('Easy. Trusted.')}<br /><em>{copy('Comfortable.')}</em></h2><p>{copy('We are building a property experience where every person in the journey can move with more clarity and confidence.')}</p></div><div className="trust-cards"><article><span className="trust-icon"><Icon name="search" size={24} /></span><h3>{copy('Easier discovery')}</h3><p>{copy('Spend less time searching and more time finding possibilities that feel right for you.')}</p></article><article><span className="trust-icon"><Icon name="check" size={24} /></span><h3>{copy('Information you can trust')}</h3><p>{copy('Clear property details and thoughtful verification will help you take the next step with confidence.')}</p></article><article><span className="trust-icon"><Icon name="users" size={24} /></span><h3>{copy('Better together')}</h3><p>{copy('Clients, Komisiyoneri and owners work more effectively when everyone has a clearer view.')}</p></article></div></section>

      <section className="stories-section section container" id="post-property"><div className="section-heading split-heading"><div><p className="eyebrow">{copy('People first')}</p><h2>{copy('Small wins that')}<br /><em>{copy('make home easier.')}</em></h2></div><p className="section-description">{copy('Illustrative stories based on the everyday housing needs Umutungo is designed to make simpler.')}</p></div><div className="story-grid"><article className="story-card"><div className="story-card-meta"><span>{copy('Tenant · Kicukiro')}</span><span>01</span></div><h3>“{copy('I stopped wasting weekends on empty viewings.')}”</h3><p>{copy('After two weeks of unanswered messages, Aline searched by neighbourhood and budget. Clear photos and direct contact details helped her compare three homes before choosing a one-bedroom close to work.')}</p><div className="story-outcome"><strong>{copy('A clearer search')}</strong><small>{copy('Aline found a home that fit her routine.')}</small></div></article><article className="story-card"><div className="story-card-meta"><span>{copy('Young family · Gasabo')}</span><span>02</span></div><h3>“{copy('We knew what to ask before we visited.')}”</h3><p>{copy('Patrick and Diane needed a three-bedroom near their children’s school. They saved suitable listings, checked the location details together, and arrived at each viewing prepared.')}</p><div className="story-outcome"><strong>{copy('More confident decisions')}</strong><small>{copy('Less back-and-forth for the whole family.')}</small></div></article><article className="story-card"><div className="story-card-meta"><span>{copy('Property owner · Nyarugenge')}</span><span>03</span></div><h3>“{copy('I shared the important details once.')}”</h3><p>{copy('When Mugisha’s apartment became available, he put the rent, utilities and move-in date in one simple listing. Serious enquiries came with better questions, saving him time.')}</p><div className="story-outcome"><strong>{copy('Better conversations')}</strong><small>{copy('More useful enquiries from the start.')}</small></div></article></div></section>
      <ReviewPanel language={language} />
    </main>
    <Footer language={language} />
  </div>;
}
