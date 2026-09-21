'use client';

import Image from 'next/image';
import { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';
import { Language, t } from '../data/translations';
import { PropertyPlaceholder } from './PropertyCard';

type PropertyViewerProps = { language: Language; property: PropertyPlaceholder; onClose: () => void };
type ViewerMode = 'photos' | 'tour' | 'plan';

export function PropertyViewer({ language, property, onClose }: PropertyViewerProps) {
  const images = property.images?.length ? property.images : [property.image];
  const [activeImage, setActiveImage] = useState(0);
  const [mode, setMode] = useState<ViewerMode>('photos');
  const [tourStop, setTourStop] = useState(0);
  const [turn, setTurn] = useState(0);
  const [playerPosition, setPlayerPosition] = useState({ x: 50, y: 62 });
  const [requestSent, setRequestSent] = useState(false);
  const dragStart = useRef<{ x: number; turn: number } | null>(null);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', closeOnEscape); };
  }, [onClose]);

  const changeImage = (direction: number) => setActiveImage((current) => (current + direction + images.length) % images.length);
  const isLand = property.type === 'Land';
  const isCommercial = property.type === 'Commercial';
  const tourNames = isLand ? [t(language, 'Site entrance'), t(language, 'Buildable area'), t(language, 'Access road')] : isCommercial ? [t(language, 'Open workspace'), t(language, 'Meeting room'), t(language, 'Reception')] : [t(language, 'Living room'), t(language, 'Kitchen'), t(language, 'Bedroom')];
  const planNames = isLand ? [t(language, 'Plot frontage'), t(language, 'Buildable area'), t(language, 'Access road'), t(language, 'Green buffer')] : isCommercial ? [t(language, 'Open workspace'), t(language, 'Meeting room'), t(language, 'Reception'), t(language, 'Staff area')] : [t(language, 'Living room'), t(language, 'Kitchen'), t(language, 'Bedroom'), t(language, 'Garden')];
  const tourImages = [0, 1, 2].map((index) => images[Math.min(index, images.length - 1)]);
  const roomPositions = [{ x: 50, y: 62 }, { x: 71, y: 35 }, { x: 31, y: 29 }];
  const walkTo = (index: number) => { setTourStop(index); setPlayerPosition(roomPositions[index]); };
  const movePlayer = (x: number, y: number) => {
    setPlayerPosition((current) => {
      const next = { x: Math.max(16, Math.min(84, current.x + x)), y: Math.max(20, Math.min(78, current.y + y)) };
      const nearest = roomPositions.reduce((best, position, index) => {
        const distance = Math.hypot(position.x - next.x, position.y - next.y);
        return distance < best.distance ? { index, distance } : best;
      }, { index: tourStop, distance: Number.POSITIVE_INFINITY });
      if (nearest.distance < 14) setTourStop(nearest.index);
      return next;
    });
  };
  const handleGameKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, [number, number]> = { w: [0, -4], ArrowUp: [0, -4], s: [0, 4], ArrowDown: [0, 4], a: [-4, 0], ArrowLeft: [-4, 0], d: [4, 0], ArrowRight: [4, 0] };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    movePlayer(move[0], move[1]);
  };
  const startLook = (event: ReactPointerEvent<HTMLDivElement>) => { dragStart.current = { x: event.clientX, turn }; event.currentTarget.setPointerCapture(event.pointerId); };
  const dragLook = (event: ReactPointerEvent<HTMLDivElement>) => { if (dragStart.current) setTurn(dragStart.current.turn + (event.clientX - dragStart.current.x) * .35); };
  const stopLook = () => { dragStart.current = null; };

  return <div className="property-viewer-overlay" role="dialog" aria-modal="true" aria-labelledby="property-viewer-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="property-viewer">
      <header className="property-viewer-header">
        <div><span className="eyebrow">{t(language, 'Verified listing')}</span><h2 id="property-viewer-title">{t(language, property.title)}</h2><p><Icon name="pin" size={14} /> {t(language, property.location)}</p></div>
        <button className="property-viewer-close" type="button" onClick={onClose} aria-label={t(language, 'Close property viewer')}><Icon name="x" size={20} /></button>
      </header>

      <div className="property-viewer-tabs" role="tablist" aria-label={t(language, 'Property media')}>
        <button className={mode === 'photos' ? 'is-active' : ''} type="button" role="tab" aria-selected={mode === 'photos'} onClick={() => setMode('photos')}><Icon name="building" size={15} /> {t(language, 'Photos')}</button>
        <button className={mode === 'tour' ? 'is-active' : ''} type="button" role="tab" aria-selected={mode === 'tour'} onClick={() => setMode('tour')}><Icon name="sparkles" size={15} /> {t(language, '3D tour')}</button>
        <button className={mode === 'plan' ? 'is-active' : ''} type="button" role="tab" aria-selected={mode === 'plan'} onClick={() => setMode('plan')}><Icon name="home" size={15} /> {t(language, 'Floor plan')}</button>
      </div>

      <div className="property-viewer-grid">
        <div className="property-viewer-media">
          {mode === 'photos' && <div className="viewer-photo-stage"><Image src={images[activeImage]} alt={t(language, property.title)} fill sizes="(max-width: 900px) 100vw, 62vw" priority className="viewer-main-image" /><span className="viewer-media-count">{activeImage + 1} / {images.length}</span><button className="viewer-arrow viewer-arrow-prev" type="button" onClick={() => changeImage(-1)} aria-label={t(language, 'Previous property image')}><Icon name="chevron" size={21} /></button><button className="viewer-arrow viewer-arrow-next" type="button" onClick={() => changeImage(1)} aria-label={t(language, 'Next property image')}><Icon name="chevron" size={21} /></button></div>}

          {mode === 'tour' && <div className="viewer-tour-stage viewer-game-stage" tabIndex={0} onKeyDown={handleGameKey} onPointerDown={startLook} onPointerMove={dragLook} onPointerUp={stopLook} onPointerCancel={stopLook} onPointerLeave={stopLook} style={{ backgroundImage: `linear-gradient(180deg, rgba(8, 22, 12, .04), rgba(8, 22, 12, .78)), url(${tourImages[tourStop]})`, backgroundPosition: `${50 + turn * .12}% center` }}>
            <div className="viewer-tour-topline"><span><Icon name="sparkles" size={15} /> {t(language, 'Walk-through mode')}</span><small>{t(language, 'WASD / arrows to move · drag to look')}</small></div>
            <div className="viewer-room-3d" style={{ transform: `translate(-50%, -48%) rotateX(56deg) rotateZ(-7deg) rotateY(${turn}deg)` }}><div className="viewer-room-floor" /><div className="viewer-room-wall viewer-room-wall-back" /><div className="viewer-room-wall viewer-room-wall-side" /><div className="viewer-room-rug" /><div className="viewer-room-sofa"><i /><i /><i /></div><div className="viewer-room-table"><i /><i /><i /><i /></div><div className="viewer-room-plant"><i /><b /><b /><b /></div></div>
            <div className="viewer-game-crosshair" aria-hidden="true" />
            <div className="viewer-tour-label"><strong>{tourNames[tourStop]}</strong><span>{t(language, 'Walk through the home and explore each stop')}</span></div>
            <div className="viewer-mini-map" aria-label={t(language, 'Property map')}><span className="viewer-mini-map-title">{t(language, 'MAP')}</span><div className="viewer-mini-map-canvas">{tourNames.map((name, index) => <button key={name} className={tourStop === index ? 'is-active' : ''} type="button" style={{ left: `${roomPositions[index].x}%`, top: `${roomPositions[index].y}%` }} onClick={() => walkTo(index)} aria-label={`${t(language, 'Walk to')} ${name}`}><span>{index + 1}</span></button>)}<i style={{ left: `${playerPosition.x}%`, top: `${playerPosition.y}%` }} /></div></div>
            <div className="viewer-game-controls"><button type="button" onClick={() => movePlayer(0, -4)} aria-label={t(language, 'Move forward')}>W</button><div><button type="button" onClick={() => movePlayer(-4, 0)} aria-label={t(language, 'Move left')}>A</button><button type="button" onClick={() => movePlayer(0, 4)} aria-label={t(language, 'Move backward')}>S</button><button type="button" onClick={() => movePlayer(4, 0)} aria-label={t(language, 'Move right')}>D</button></div></div>
            <div className="viewer-tour-controls"><button type="button" onClick={() => setTurn((current) => current - 18)} aria-label={t(language, 'Turn view left')}><Icon name="chevron" size={17} /></button><div>{tourNames.map((name, index) => <button className={tourStop === index ? 'is-active' : ''} type="button" key={name} onClick={() => walkTo(index)}>{name}</button>)}</div><button type="button" onClick={() => setTurn((current) => current + 18)} aria-label={t(language, 'Turn view right')}><Icon name="chevron" size={17} /></button></div>
          </div>}

          {mode === 'plan' && <div className="viewer-plan-stage"><div className="viewer-plan-heading"><span>{t(language, isLand ? 'Interactive site plan' : 'Interactive floor plan')}</span><small>{t(language, 'Tap a room to preview it')}</small></div><div className="viewer-floor-plan"><button className="viewer-plan-room plan-living" type="button" onClick={() => { setMode('tour'); walkTo(0); }}>{planNames[0]}<small>{isLand ? '620 m2' : isCommercial ? '82 m2' : '38 m2'}</small></button><button className="viewer-plan-room plan-kitchen" type="button" onClick={() => { setMode('tour'); walkTo(1); }}>{planNames[1]}<small>{isLand ? 'North side' : isCommercial ? '24 m2' : '14 m2'}</small></button><button className="viewer-plan-room plan-bedroom" type="button" onClick={() => { setMode('tour'); walkTo(2); }}>{planNames[2]}<small>{isLand ? 'Street edge' : isCommercial ? 'Front desk' : `${property.bedrooms} rooms`}</small></button><button className="viewer-plan-room plan-garden" type="button" onClick={() => { setMode('tour'); walkTo(2); }}>{planNames[3]}<small>{isLand ? 'Setback' : isCommercial ? 'Back of house' : 'Outdoor'}</small></button><span className="plan-door plan-door-one" /><span className="plan-door plan-door-two" /></div></div>}

          <div className="viewer-thumbnails">{images.map((image, index) => <button className={mode === 'photos' && activeImage === index ? 'is-active' : ''} type="button" key={`${image}-thumb-${index}`} onClick={() => { setMode('photos'); setActiveImage(index); }}><Image src={image} alt="" fill sizes="90px" /></button>)}</div>
        </div>

        <aside className="property-viewer-details"><div className="viewer-price-row"><div><span className="property-type">{t(language, property.type)}</span><strong>{property.price}</strong><small>{t(language, property.priceNote)}</small></div><button className="viewer-share" type="button" onClick={() => navigator.clipboard?.writeText(window.location.href)} aria-label={t(language, 'Copy property link')}><Icon name="arrow" size={16} /></button></div><div className="viewer-stats"><span><strong>{property.bedrooms}</strong>{t(language, 'beds')}</span><span><strong>{property.bathrooms}</strong>{t(language, 'baths')}</span><span><strong>{property.area}</strong>m2</span></div><p className="viewer-description">{t(language, 'A carefully presented property with clear details, flexible spaces and a location worth exploring in person.')}</p><div className="viewer-highlights"><span><Icon name="check" size={15} /> {t(language, 'Verified owner')}</span><span><Icon name="check" size={15} /> {t(language, 'Secure enquiries')}</span><span><Icon name="check" size={15} /> {t(language, 'Virtual tour ready')}</span></div><button className="viewer-request-button" type="button" onClick={() => setRequestSent(true)}>{requestSent ? t(language, 'Viewing request sent') : t(language, 'Request a viewing')} <Icon name="arrow" size={16} /></button>{requestSent && <p className="viewer-request-success" role="status">{t(language, 'We will connect you with the property contact.')}</p>}<small className="viewer-listed">{t(language, property.listed)}</small></aside>
      </div>
    </section>
  </div>;
}
