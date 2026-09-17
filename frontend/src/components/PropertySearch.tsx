import { FormEvent } from 'react';
import { Icon } from './Icons';
import { Language, t } from '../data/translations';

type PropertySearchProps = { language: Language; location: string; type: string; intent: string; onLocationChange: (value: string) => void; onTypeChange: (value: string) => void; onIntentChange: (value: string) => void; onSubmit: () => void };

export function PropertySearch({ language, location, type, intent, onLocationChange, onTypeChange, onIntentChange, onSubmit }: PropertySearchProps) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSubmit(); };
  return (
    <form className="property-search" onSubmit={submit} aria-label={t(language, 'Search')}>
      <div className="search-label"><span className="search-label-icon"><Icon name="search" size={18} /></span><span><small>{t(language, 'Start your search')}</small><strong>{t(language, 'Where are you looking?')}</strong></span></div>
      <label className="search-control"><Icon name="pin" size={18} /><span><small>{t(language, 'Location')}</small><select value={location} onChange={(event) => onLocationChange(event.target.value)}><option value="Kigali">{t(language, 'Kigali')}</option><option value="Eastern Province">{t(language, 'Eastern Province')}</option><option value="Northern Province">{t(language, 'Northern Province')}</option><option value="Southern Province">{t(language, 'Southern Province')}</option><option value="Western Province">{t(language, 'Western Province')}</option></select></span><Icon name="chevron" size={15} /></label>
      <label className="search-control"><Icon name="home" size={18} /><span><small>{t(language, 'Property type')}</small><select value={type} onChange={(event) => onTypeChange(event.target.value)}><option value="Any type">{t(language, 'Any type')}</option><option value="House">{t(language, 'House')}</option><option value="Apartment">{t(language, 'Apartments')}</option><option value="Land">{t(language, 'Land')}</option><option value="Commercial">{t(language, 'Commercial')}</option></select></span><Icon name="chevron" size={15} /></label>
      <label className="search-control compact"><span><small>{t(language, 'Looking to')}</small><select value={intent} onChange={(event) => onIntentChange(event.target.value)}><option value="Buy or rent">{t(language, 'Buy or rent')}</option><option value="Buy">{t(language, 'Buy')}</option><option value="Rent">{t(language, 'Rent')}</option></select></span><Icon name="chevron" size={15} /></label>
      <button className="button button-primary search-submit" type="submit">{t(language, 'Search')} <Icon name="arrow" size={16} /></button>
    </form>
  );
}
