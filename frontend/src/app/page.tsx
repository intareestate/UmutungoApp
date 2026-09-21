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

const properties: PropertyPlaceholder[] = [
  { id: 'gisozi-home', title: 'Four-bedroom home with garden', type: 'House', location: 'Gisozi - Kigali', price: 'RWF 1,250,000', priceNote: '/ month', bedrooms: 4, bathrooms: 3, area: 220, accent: '#08a650', image: '/properties/house-01.jpg', listed: 'Listed 4 days ago' },
  { id: 'nyarutarama-home', title: 'Five-bedroom family residence', type: 'House', location: 'Nyarutarama - Kigali', price: 'RWF 2,400,000', priceNote: '/ month', bedrooms: 5, bathrooms: 4, area: 310, accent: '#6d8d6f', image: '/properties/house-02.jpg', listed: 'Listed 2 weeks ago' },
  { id: 'kacyiru-apartment', title: 'Light-filled Kacyiru apartment', type: 'Apartment', location: 'Kacyiru - Kigali', price: 'RWF 1,100,000', priceNote: '/ month', bedrooms: 2, bathrooms: 2, area: 118, accent: '#b17c5b', image: '/properties/apartment-01.jpg', listed: 'Listed yesterday' },
  { id: 'kimihurura-apartment', title: 'Modern apartment near Kimihurura', type: 'Apartment', location: 'Kimihurura - Kigali', price: 'RWF 1,650,000', priceNote: '/ month', bedrooms: 3, bathrooms: 2, area: 145, accent: '#7f8f77', image: '/properties/apartment-02.jpg', listed: 'Listed 3 days ago' },
  { id: 'gacuriro-land', title: 'Residential plot in Gacuriro', type: 'Land', location: 'Gacuriro - Kigali', price: 'RWF 85,000,000', priceNote: ' asking', bedrooms: 0, bathrooms: 0, area: 620, accent: '#788f55', image: '/properties/land-01.jpg', listed: 'Listed 5 days ago' },
  { id: 'remera-commercial', title: 'Street-facing commercial space', type: 'Commercial', location: 'Remera - Kigali', price: 'RWF 1,900,000', priceNote: '/ month', bedrooms: 0, bathrooms: 1, area: 180, accent: '#8a674d', image: '/properties/commercial-01.jpg', listed: 'Listed 1 week ago' },
  { id: 'kicukiro-workspace', title: 'Flexible office in Kicukiro', type: 'Commercial', location: 'Kicukiro - Kigali', price: 'RWF 2,250,000', priceNote: '/ month', bedrooms: 0, bathrooms: 2, area: 240, accent: '#516d75', image: '/properties/commercial-02.jpg', listed: 'Listed 2 weeks ago' },
];

const categories = [
  { name: 'Homes', detail: 'Family houses and places to rent.', image: '/properties/house-01.jpg' },
  { name: 'Apartments', detail: 'Easy city living in Kigali.', image: '/properties/apartment-01.jpg' },
  { name: 'Land', detail: 'Plots for your next project.', image: '/properties/land-01.jpg' },
  { name: 'Commercial spaces', detail: 'Shops, offices and workspaces.', image: '/properties/commercial-01.jpg' },
];

const neighbourhoods = [
  { name: 'Nyarutarama', note: 'Leafy streets and larger homes.', image: '/properties/house-02.jpg' },
  { name: 'Kacyiru', note: 'Close to offices and embassies.', image: '/properties/apartment-01.jpg' },
  { name: 'Kimihurura', note: 'Restaurants, offices and city life.', image: '/properties/apartment-02.jpg' },
  { name: 'Remera', note: 'Good transport and everyday essentials.', image: '/properties/commercial-01.jpg' },
  { name: 'Gacuriro', note: 'Newer homes and quieter streets.', image: '/properties/land-01.jpg' },
];

const categoryTypes: Record<string, string> = { Homes: 'House', Apartments: 'Apartment', Land: 'Land', 'Commercial spaces': 'Commercial' };

export default function HomePage() {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('English');
  const [location, setLocation] = useState('Kigali');
  const [type, setType] = useState('Any type');
  const [intent, setIntent] = useState('Buy or rent');
  const [priceRange, setPriceRange] = useState('Any price');
  const [searchMessage, setSearchMessage] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const copy = (key: string) => t(language, key);

  useEffect(() => {
    if (window.localStorage.getItem('umutungo-theme') === 'dark') setDarkMode(true);
  }, []);

  useEffect(() => {
    const localeMap: Record<string, string> = { English: 'en', French: 'fr', Kinyarwanda: 'rw', Swahili: 'sw' };
    document.documentElement.lang = localeMap[language] ?? 'en';
  }, [language]);

  const toggleTheme = () => setDarkMode((current) => {
    const next = !current;
    window.localStorage.setItem('umutungo-theme', next ? 'dark' : 'light');
    return next;
  });

  const requestTenantSignIn = () => window.dispatchEvent(new Event('umutungo:request-sign-in'));
  const submitSearch = () => {
    if ((intent === 'Buy' || intent === 'Rent') && !window.localStorage.getItem('umutungo-demo-user')) { requestTenantSignIn(); return; }
    setSearchMessage(`Showing ${copy(intent).toLowerCase()} properties in ${copy(location)}.`);
    document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleFavorite = (id: string) => setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const selectCategory = (category: string) => {
    const categorySlugs: Record<string, string> = { Homes: 'houses', Apartments: 'apartments', Land: 'land', 'Commercial spaces': 'commercial' };
    window.location.assign(`/categories/${categorySlugs[category] ?? 'houses'}`);
  };
  const visibleProperties = selectedCategory ? properties.filter((property) => property.type === categoryTypes[selectedCategory]) : properties;

  return <div className={`${darkMode ? 'app theme-dark' : 'app'} app-realistic`}>
    <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} language={language} onLanguageChange={setLanguage} />
    <AiChatbot language={language} />
    <main>
      <section className="hero-section" id="home">
        <div className="hero-image"><div className="hero-image-overlay" /><div className="container hero-content"><div className="hero-copy">
          <h1>{copy('Find a place')} <em>{copy('that feels like home.')}</em></h1>
          <p className="hero-lead">{copy('Browse verified homes, land and commercial spaces across Rwanda.')}</p>
          <div className="hero-actions"><a className="button button-primary" href="#properties">{copy('Browse properties')} <Icon name="arrow" size={16} /></a></div>
        </div></div></div>
        <div className="container hero-search-wrap"><PropertySearch language={language} location={location} type={type} intent={intent} priceRange={priceRange} onLocationChange={setLocation} onTypeChange={setType} onIntentChange={(value) => { setIntent(value); if ((value === 'Buy' || value === 'Rent') && !window.localStorage.getItem('umutungo-demo-user')) requestTenantSignIn(); }} onPriceRangeChange={setPriceRange} onSubmit={submitSearch} /><div className="trust-signals" aria-label={copy('Trust signals')}><span>{copy('Verified listings')}</span><span>{copy('Trusted agents')}</span><span>{copy('Secure enquiries')}</span></div></div>
      </section>

      <section className="section section-property container" id="properties">
        <div className="section-heading split-heading"><div><p className="eyebrow">{selectedCategory ? copy('Category view') : copy('Featured properties')}</p><h2>{selectedCategory ? copy(selectedCategory) : copy('Places worth')}<br /><em>{selectedCategory ? copy('properties.') : copy('a closer look.')}</em></h2></div><p className="section-description">{selectedCategory ? `${visibleProperties.length} ${copy('properties found in this category.')}` : copy('A small selection of homes currently available in Kigali.')}</p></div>
        {searchMessage && <div className="search-feedback" role="status"><Icon name="check" size={16} /> {searchMessage}</div>}
        <div className="property-grid">{visibleProperties.map((property) => <PropertyCard key={property.id} language={language} property={property} favorite={favorites.includes(property.id)} onFavorite={() => toggleFavorite(property.id)} onView={() => setSearchMessage(`${copy(property.title)} - ${copy('viewing requests will be available soon.')}`)} />)}</div>
        {selectedCategory ? <button className="category-reset" type="button" onClick={() => { setSelectedCategory(''); setType('Any type'); }}>{copy('Show all properties')}</button> : <p className="placeholder-note"><span /> {copy('More verified listings are being added.')}</p>}
      </section>

      <section className="category-section section container" id="categories">
        <div className="section-heading split-heading"><div><p className="eyebrow">{copy('Browse by category')}</p><h2>{copy('Find your kind')}<br /><em>{copy('of place.')}</em></h2></div><p className="section-description">{copy('Choose a starting point, then narrow it down by area, budget and what matters to you.')}</p></div>
        <div className="category-grid premium-category-grid">{categories.map((category) => <button className="premium-category-card" type="button" key={category.name} onClick={() => selectCategory(category.name)}><span className="premium-category-image" style={{ backgroundImage: `url(${category.image})` }} /><span className="premium-category-copy"><strong>{copy(category.name)}</strong><small>{copy(category.detail)}</small><Icon name="arrow" size={15} /></span></button>)}</div>
      </section>

      <section className="neighbourhood-section section container" id="explore">
        <div className="section-heading split-heading"><div><p className="eyebrow">{copy('Explore Kigali')}</p><h2>{copy('Look around')}<br /><em>{copy('the neighbourhoods.')}</em></h2></div><p className="section-description">{copy('Get a feel for the areas people choose for home, work and everyday life.')}</p></div>
        <div className="neighbourhood-grid">{neighbourhoods.map((neighbourhood, index) => <a className={`neighbourhood-card neighbourhood-card-${index + 1}`} href="#properties" key={neighbourhood.name} style={{ backgroundImage: `linear-gradient(180deg, rgba(8, 20, 11, .05), rgba(8, 20, 11, .78)), url(${neighbourhood.image})` }}><span><strong>{copy(neighbourhood.name)}</strong><small>{copy(neighbourhood.note)}</small></span><Icon name="arrow" size={17} /></a>)}</div>
      </section>

      <section className="stats-section"><div className="container stats-grid"><div><strong>1,200+</strong><span>{copy('properties listed')}</span></div><div><strong>300+</strong><span>{copy('verified agents')}</span></div><div><strong>15</strong><span>{copy('districts covered')}</span></div></div></section>

      <section className="listing-cta container" id="post-property"><div><p className="eyebrow">{copy('For owners and agents')}</p><h2>{copy('Have a place to')}<br /><em>{copy('rent or sell?')}</em></h2></div><div><p>{copy('Put the price, location and key details in one clear listing.')}</p></div></section>

      <ReviewPanel language={language} />
    </main>
    <Footer language={language} />
  </div>;
}
