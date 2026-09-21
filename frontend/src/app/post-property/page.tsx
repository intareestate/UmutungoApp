'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChangeEvent, useState } from 'react';
import { Icon } from '../../components/Icons';
import { Logo } from '../../components/Logo';

type PropertyType = 'House' | 'Apartment' | 'Land' | 'Commercial' | 'Office' | 'Equipment' | 'Hospitality';
type Intent = 'For rent' | 'For sale';

const steps = [
  { number: 1, label: 'Property story', note: 'What are you offering?' },
  { number: 2, label: 'Place & price', note: 'Help people find it.' },
  { number: 3, label: 'Media & publish', note: 'Make it memorable.' },
];

const typeOptions: { key: PropertyType; label: string; icon: 'home' | 'building' | 'leaf' | 'users' }[] = [
  { key: 'House', label: 'Houses', icon: 'home' },
  { key: 'Apartment', label: 'Apartments', icon: 'building' },
  { key: 'Land', label: 'Land', icon: 'leaf' },
  { key: 'Commercial', label: 'Commercial', icon: 'building' },
  { key: 'Office', label: 'Offices', icon: 'building' },
  { key: 'Equipment', label: 'Equipment', icon: 'users' },
  { key: 'Hospitality', label: 'Hospitality', icon: 'home' },
];

const curatedImages: Record<PropertyType, string[]> = {
  House: ['/properties/house-01.jpg', '/properties/tour-living.jpg', '/properties/tour-kitchen.jpg'],
  Apartment: ['/properties/apartment-01.jpg', '/properties/apartment-02.jpg', '/properties/tour-bedroom-real.jpg'],
  Land: ['/properties/land-01.jpg'],
  Commercial: ['/properties/commercial-01.jpg', '/properties/commercial-02.jpg'],
  Office: ['/properties/commercial-02.jpg', '/properties/commercial-01.jpg'],
  Equipment: ['/properties/commercial-01.jpg'],
  Hospitality: ['/properties/house-02.jpg', '/properties/tour-living.jpg'],
};

const defaultTitles: Record<PropertyType, string> = {
  House: 'Bright family home with room to breathe',
  Apartment: 'Light-filled apartment in Kigali',
  Land: 'A ready-to-build plot with a clear future',
  Commercial: 'Flexible commercial space for your next move',
  Office: 'A polished office ready for productive work',
  Equipment: 'Reliable equipment ready for its next operator',
  Hospitality: 'A welcoming stay with room to remember',
};

const amenityOptions = ['Parking', 'Garden', 'Furnished', 'Security', 'Water tank', 'Internet ready'];

export default function PostPropertyPage() {
  const [step, setStep] = useState(1);
  const [propertyType, setPropertyType] = useState<PropertyType>('House');
  const [intent, setIntent] = useState<Intent>('For rent');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Kigali');
  const [marketIntent, setMarketIntent] = useState('Buy or rent');
  const [priceRange, setPriceRange] = useState('Any price');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('1,250,000');
  const [bedrooms, setBedrooms] = useState('4');
  const [bathrooms, setBathrooms] = useState('3');
  const [area, setArea] = useState('220');
  const [amenities, setAmenities] = useState<string[]>(['Parking', 'Security']);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedCover, setSelectedCover] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  const gallery = uploadedImages.length ? uploadedImages : curatedImages[propertyType];
  const cover = selectedCover ?? gallery[0];
  const listingTitle = title.trim() || defaultTitles[propertyType];
  const isLand = propertyType === 'Land';
  const selectedType = typeOptions.find((item) => item.key === propertyType) ?? typeOptions[0];

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setUploadedImages(files.map((file) => URL.createObjectURL(file)));
    setSelectedCover(null);
  };

  const toggleAmenity = (amenity: string) => setAmenities((current) => current.includes(amenity) ? current.filter((item) => item !== amenity) : [...current, amenity]);
  const next = () => setStep((current) => Math.min(3, current + 1));
  const previous = () => setStep((current) => Math.max(1, current - 1));

  if (published) {
    return <main className="post-property-page"><header className="post-property-header"><Link href="/" aria-label="Umutungo home"><Logo /></Link><div className="post-header-links"><Link className="post-home-link" href="/"><Icon name="home" size={14} /> Home</Link><Link className="post-exit-link" href="/"><Icon name="x" size={14} /> Exit builder</Link></div></header><section className="post-success"><div className="post-success-mark"><Icon name="check" size={30} /></div><p className="post-eyebrow">Listing saved</p><h1>Your place is ready<br /><em>for its next chapter.</em></h1><p>We have saved “{listingTitle}” as a new listing draft. Add verification documents from your dashboard when you are ready to publish it publicly.</p><div className="post-success-actions"><Link className="post-primary-button" href="/"><span>Return to marketplace</span><Icon name="arrow" size={15} /></Link><button className="post-secondary-button" type="button" onClick={() => setPublished(false)}>Edit listing</button></div></section></main>;
  }

  return <main className="post-property-page">
    <header className="post-property-header"><Link href="/" aria-label="Umutungo home"><Logo /></Link><div className="post-header-center"><span className="post-live-dot" /> Draft autosaved</div><div className="post-header-links"><Link className="post-home-link" href="/"><Icon name="home" size={14} /> Home</Link><Link className="post-exit-link" href="/"><Icon name="x" size={14} /> Exit builder</Link></div></header>
    <div className="post-property-layout">
      <aside className="post-property-sidebar"><div><p className="post-eyebrow">New listing</p><h1>Make a place<br /><em>feel possible.</em></h1><p className="post-sidebar-copy">Tell the story clearly. The right people are already looking.</p></div><nav className="post-progress" aria-label="Listing steps">{steps.map((item) => <button className={step === item.number ? 'is-active' : step > item.number ? 'is-complete' : ''} type="button" key={item.number} onClick={() => setStep(item.number)}><span className="post-step-number">{step > item.number ? <Icon name="check" size={13} /> : `0${item.number}`}</span><span><strong>{item.label}</strong><small>{item.note}</small></span></button>)}</nav><div className="post-sidebar-tip"><Icon name="sparkles" size={17} /><span><strong>Small detail, big difference</strong><small>Listings with 5+ photos get more attention.</small></span></div></aside>
      <section className="post-property-main">
        <div className="post-main-heading"><div><p className="post-eyebrow">Step 0{step} of 03</p><h2>{steps[step - 1].label}</h2></div><span className="post-save-status"><Icon name="check" size={13} /> Saved locally</span></div>
        <div className="post-builder-grid"><div className="post-form-card">
          {step === 1 && <div className="post-form-section"><div className="post-section-intro"><h3>Start with the essentials</h3><p>Choose a format and give your property a title people will remember.</p></div><label className="post-field post-category-select"><span>Property category</span><div className="post-category-select-control"><span className="post-category-select-icon"><Icon name={selectedType.icon} size={18} /></span><select value={propertyType} onChange={(event) => setPropertyType(event.target.value as PropertyType)} aria-label="Property category">{typeOptions.map((item) => <option value={item.key} key={item.key}>{item.label}</option>)}</select><Icon name="chevron" size={15} /></div><small className="post-category-help">Choose the category that best describes what you are listing.</small></label><div className="post-field-group"><span className="post-field-label">Listing intent</span><div className="post-segmented"><button className={intent === 'For rent' ? 'is-selected' : ''} type="button" onClick={() => setIntent('For rent')}>For rent</button><button className={intent === 'For sale' ? 'is-selected' : ''} type="button" onClick={() => setIntent('For sale')}>For sale</button></div></div><label className="post-field"><span>Listing title</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={defaultTitles[propertyType]} /></label><label className="post-field"><span>Short description <small>Optional</small></span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What makes this place special? Mention the light, the view, the street or the feeling." rows={4} /></label></div>}
          {step === 2 && <div className="post-form-section"><div className="post-section-intro"><h3>Give it a sense of place</h3><p>A clear location and honest numbers make a listing feel trustworthy.</p></div><div className="post-market-filters"><label className="post-field"><span>Location</span><select value={location} onChange={(event) => setLocation(event.target.value)}><option>Kigali</option><option>Eastern Province</option><option>Northern Province</option><option>Southern Province</option><option>Western Province</option></select></label><label className="post-field"><span>For sale / rent</span><select value={marketIntent} onChange={(event) => { const value = event.target.value; setMarketIntent(value); if (value === 'Buy') setIntent('For sale'); if (value === 'Rent') setIntent('For rent'); }}><option>Buy or rent</option><option>Buy</option><option>Rent</option></select></label><label className="post-field"><span>Price range</span><select value={priceRange} onChange={(event) => setPriceRange(event.target.value)}><option>Any price</option><option>Under RWF 500,000</option><option>RWF 500,000 - 1,000,000</option><option>Over RWF 1,000,000</option></select></label></div><label className="post-field"><span>Neighbourhood</span><input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="e.g. Kacyiru, near the offices" /></label><div className="post-price-field"><label className="post-field"><span>{intent === 'For rent' ? 'Monthly price' : 'Asking price'}</span><div className="post-input-prefix"><b>RWF</b><input value={price} onChange={(event) => setPrice(event.target.value)} inputMode="numeric" /></div></label><span className="post-price-note">{intent === 'For rent' ? 'per month' : 'total asking price'}</span></div><div className="post-form-grid post-stats-grid"><label className="post-field"><span>{isLand ? 'Plot size' : 'Bedrooms'}</span><div className="post-input-suffix"><input value={isLand ? area : bedrooms} onChange={(event) => isLand ? setArea(event.target.value) : setBedrooms(event.target.value)} inputMode="numeric" /><b>{isLand ? 'm²' : 'beds'}</b></div></label><label className="post-field"><span>{isLand ? 'Tenure' : 'Bathrooms'}</span><div className="post-input-suffix"><input value={isLand ? 'Freehold' : bathrooms} onChange={(event) => isLand ? null : setBathrooms(event.target.value)} inputMode={isLand ? 'text' : 'numeric'} /><b>{isLand ? '' : 'baths'}</b></div></label><label className="post-field"><span>{isLand ? 'Road access' : 'Floor area'}</span><div className="post-input-suffix"><input value={isLand ? 'Yes' : area} onChange={(event) => isLand ? null : setArea(event.target.value)} inputMode="numeric" /><b>{isLand ? '' : 'm²'}</b></div></label></div><div className="post-field-group"><span className="post-field-label">Highlights</span><div className="post-amenities">{amenityOptions.map((amenity) => <button className={amenities.includes(amenity) ? 'is-selected' : ''} type="button" key={amenity} onClick={() => toggleAmenity(amenity)}>{amenities.includes(amenity) && <Icon name="check" size={12} />}{amenity}</button>)}</div></div></div>}
          {step === 3 && <div className="post-form-section"><div className="post-section-intro"><h3>Let the photos do some talking</h3><p>Choose a cover that sets the mood, then add the details that help someone picture themselves there.</p></div><label className="post-dropzone"><input type="file" accept="image/*" multiple onChange={handleFiles} /><span className="post-upload-icon"><Icon name="download" size={19} /></span><strong>Drop your photos here</strong><small>or click to browse · JPG, PNG up to 10MB each</small></label><div className="post-curated-heading"><span>Start with a curated set</span><small>Swap these for your own any time</small></div><div className="post-image-choices">{curatedImages[propertyType].map((image) => <button className={cover === image ? 'is-selected' : ''} type="button" key={image} onClick={() => { setSelectedCover(image); setUploadedImages([]); }}><Image src={image} alt="Suggested property view" fill sizes="120px" />{cover === image && <span><Icon name="check" size={13} /></span>}</button>)}</div><div className="post-amenities-summary"><span>Selected highlights</span><div>{amenities.length ? amenities.map((amenity) => <b key={amenity}>{amenity}</b>) : <small>Add a few highlights above</small>}</div></div></div>}
          <div className="post-form-actions">{step > 1 ? <button className="post-secondary-button" type="button" onClick={previous}><Icon name="arrow" size={14} /> Back</button> : <span />}{step < 3 ? <button className="post-primary-button" type="button" onClick={next}><span>Continue</span><Icon name="arrow" size={15} /></button> : <button className="post-primary-button" type="button" onClick={() => setPublished(true)}><span>Save listing draft</span><Icon name="arrow" size={15} /></button>}</div>
        </div><aside className="post-preview-wrap"><div className="post-preview-label"><span>Live preview</span><small>How it will look in Umutungo</small></div><article className="post-preview-card"><div className="post-preview-image"><Image src={cover} alt="Property preview" fill sizes="(max-width: 900px) 100vw, 350px" /><span className="post-preview-badge">{intent}</span><button type="button" aria-label="Save preview"><Icon name="heart" size={17} /></button><div className="post-preview-dots">{gallery.slice(0, 4).map((_, index) => <i className={index === 0 ? 'is-active' : ''} key={index} />)}</div></div><div className="post-preview-content"><span className="post-preview-type">{propertyType} · Verified after review</span><h3>{listingTitle}</h3><p><Icon name="pin" size={13} /> {address || 'Your neighbourhood'}, {location}</p><strong>RWF {price || '0'} <small>{intent === 'For rent' ? '/ month' : 'asking'}</small></strong><div className="post-preview-stats"><span>{isLand ? area : bedrooms}<small>{isLand ? 'm²' : 'beds'}</small></span><span>{isLand ? 'Freehold' : bathrooms}<small>{isLand ? 'tenure' : 'baths'}</small></span><span>{isLand ? 'Road ready' : area}<small>{isLand ? '' : 'm²'}</small></span></div></div></article><p className="post-preview-note"><Icon name="sparkles" size={14} /> Your draft stays private until you publish it.</p></aside></div>
      </section>
    </div>
  </main>;
}
