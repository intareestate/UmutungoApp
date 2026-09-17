import Image from 'next/image';
import { Icon } from './Icons';
import { Language, t } from '../data/translations';

export type PropertyPlaceholder = { id: string; title: string; type: string; location: string; price: string; priceNote: string; bedrooms: number; bathrooms: number; area: number; accent: string; image: string };
type PropertyCardProps = { language: Language; property: PropertyPlaceholder; favorite: boolean; onFavorite: () => void; onView: () => void };

export function PropertyCard({ language, property, favorite, onFavorite, onView }: PropertyCardProps) {
  return (
    <article className="property-card">
      <div className="property-image"><Image src={property.image} alt={`${t(language, property.title)} ${t(language, 'property image')}`} fill sizes="(max-width: 760px) 100vw, 33vw" className="property-image-art" /><button className={`favorite-button ${favorite ? 'is-favorite' : ''}`} type="button" onClick={onFavorite} aria-label={favorite ? `${t(language, 'Remove property from favorites')}: ${t(language, property.title)}` : `${t(language, 'Save property')}: ${t(language, property.title)}`}><Icon name="heart" size={18} filled={favorite} /></button><span className="verified-badge"><Icon name="check" size={12} /> {t(language, 'Sample listing')}</span></div>
      <div className="property-card-body"><div className="property-card-top"><div><span className="property-type">{t(language, property.type)}</span><h3>{t(language, property.title)}</h3><p><Icon name="pin" size={13} /> {t(language, property.location)}</p></div><span className="property-accent" style={{ background: property.accent }} aria-hidden="true" /></div><div className="property-details"><span><strong>{property.bedrooms}</strong> {t(language, 'beds')}</span><span><strong>{property.bathrooms}</strong> {t(language, 'baths')}</span><span><strong>{property.area}</strong> m²</span></div><div className="property-card-footer"><strong>{property.price} <small>{t(language, property.priceNote)}</small></strong><button className="card-link" type="button" onClick={onView}>{t(language, 'View property')} <Icon name="arrow" size={14} /></button></div></div>
    </article>
  );
}
