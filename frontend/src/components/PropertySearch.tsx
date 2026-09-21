import { FormEvent } from 'react';
import { Icon } from './Icons';
import { Language, t } from '../data/translations';

type PropertySearchProps = { language: Language; location: string; type: string; intent: string; priceRange: string; onLocationChange: (value: string) => void; onTypeChange: (value: string) => void; onIntentChange: (value: string) => void; onPriceRangeChange: (value: string) => void; onSubmit: () => void };

export function PropertySearch({ language, location, type, intent, priceRange, onLocationChange, onTypeChange, onIntentChange, onPriceRangeChange, onSubmit }: PropertySearchProps) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSubmit(); };
  return (
    <form className="property-search" onSubmit={submit} aria-label={t(language, 'Search')}>
      <label className="search-control"><Icon name="pin" size={18} /><span><small>{t(language, 'Location')}</small><select value={location} onChange={(event) => onLocationChange(event.target.value)}><option value="Kigali">{t(language, 'Kigali')}</option><option value="Eastern Province">{t(language, 'Eastern Province')}</option><option value="Northern Province">{t(language, 'Northern Province')}</option><option value="Southern Province">{t(language, 'Southern Province')}</option><option value="Western Province">{t(language, 'Western Province')}</option></select></span><Icon name="chevron" size={15} /></label>
      <label className="search-control"><Icon name="home" size={18} /><span><small>{t(language, 'Type')}</small><select value={type} onChange={(event) => onTypeChange(event.target.value)}><option value="Any type">{t(language, 'Any type')}</option><option value="House">{t(language, 'House')}</option><option value="Apartment">{t(language, 'Apartments')}</option><option value="Land">{t(language, 'Land')}</option><option value="Commercial">{t(language, 'Commercial')}</option></select></span><Icon name="chevron" size={15} /></label>
      <label className="search-control compact"><span><small>{t(language, 'For sale / rent')}</small><select value={intent} onChange={(event) => onIntentChange(event.target.value)}><option value="Buy or rent">{t(language, 'Buy or rent')}</option><option value="Buy">{t(language, 'Buy')}</option><option value="Rent">{t(language, 'Rent')}</option></select></span><Icon name="chevron" size={15} /></label>
      <label className="search-control compact"><span><small>{t(language, 'Price range')}</small><select value={priceRange} onChange={(event) => onPriceRangeChange(event.target.value)}><option value="Any price">{t(language, 'Any price')}</option><option value="Under RWF 500,000">{t(language, 'Under RWF 500,000')}</option><option value="RWF 500,000 - 1,000,000">{t(language, 'RWF 500,000 - 1,000,000')}</option><option value="Over RWF 1,000,000">{t(language, 'Over RWF 1,000,000')}</option></select></span><Icon name="chevron" size={15} /></label>
      <button className="button button-primary search-submit" type="submit">{t(language, 'Search')} <Icon name="arrow" size={16} /></button>
    </form>
  );
}
