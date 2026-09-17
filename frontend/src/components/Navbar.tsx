import { ReactElement, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Language, t } from '../data/translations';
import { Icon } from './Icons';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

type NavbarProps = {
  darkMode: boolean;
  onToggleTheme: () => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
  isSignedIn?: boolean;
  onSignIn?: () => void;
  onAccount?: () => void;
};
const roles = ['Tenant', 'Commissioner / Komisiyoneri', 'Landlord'];
const categories = ['Houses', 'Apartments', 'Land', 'Commercial', 'Offices', 'Equipment', 'Hospitality'];
const languages: Language[] = ['English', 'French', 'Kinyarwanda', 'Swahili'];
const languageCodes: Record<Language, string> = { English: 'EN', French: 'FR', Kinyarwanda: 'RW', Swahili: 'SW' };

function HoverHint({ text, placement, children }: { text: string; placement: 'right' | 'bottom'; children: ReactElement }) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const showHint = (event: React.MouseEvent<HTMLSpanElement>) => {
    const target = event.currentTarget.firstElementChild as HTMLElement | null;
    if (!target) return;
    const bounds = target.getBoundingClientRect();
    setPosition(placement === 'right' ? { top: bounds.top + bounds.height / 2, left: bounds.right + 11 } : { top: bounds.bottom + 9, left: bounds.left + bounds.width / 2 });
  };
  return <span className="hover-hint" onMouseEnter={showHint} onMouseLeave={() => setPosition(null)}>{children}{position && createPortal(<span className={`nav-hover-panel ${placement}`} style={{ top: position.top, left: position.left }}>{text}</span>, document.body)}</span>;
}

function Dropdown({ label, items, onSelect, active, icon }: { label: string; items: string[]; onSelect: (value: string) => void; active?: string; icon?: 'users' | 'building' | 'leaf' | 'globe' }) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const toggleMenu = () => {
    if (!open) {
      const trigger = ref.current?.querySelector('button');
      if (trigger) {
        const bounds = trigger.getBoundingClientRect();
        setMenuPosition({ top: bounds.bottom + 10, right: window.innerWidth - bounds.right });
      }
    }
    setOpen(!open);
  };
  return <div className="nav-dropdown" ref={ref}><button className={`nav-link nav-dropdown-trigger ${open ? 'is-open' : ''}`} type="button" aria-expanded={open} onClick={toggleMenu}>{icon && <Icon name={icon} size={17} />}<span>{label}</span><Icon name="chevron" size={13} /></button>{open && <div className="dropdown-panel" style={menuPosition ? { position: 'fixed', top: menuPosition.top, right: menuPosition.right } : undefined}>{items.map((item) => <button key={item} className={active === item ? 'selected' : ''} type="button" onClick={() => { onSelect(item); setOpen(false); }}>{item}{active === item && <Icon name="check" size={15} />}</button>)}</div>}</div>;
}

export function Navbar({ darkMode, onToggleTheme, language, onLanguageChange, isSignedIn = false, onSignIn, onAccount }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileRoleOpen, setMobileRoleOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [mobileLanguageOpen, setMobileLanguageOpen] = useState(false);
  const [role, setRole] = useState('');
  const [category, setCategory] = useState('');
  const [quickSearch, setQuickSearch] = useState('');
  const goTo = (id: string) => { setMobileOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return <>
    <aside className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="sidebar-shell"><nav className="sidebar-nav" aria-label="Property navigation">
        <a className="sidebar-nav-link sidebar-market-link" href="#properties" aria-label={t(language, 'Renting')}><Icon name="home" size={17} /><span>{t(language, 'Renting')}</span></a>
        <a className="sidebar-nav-link sidebar-market-link" href="#properties" aria-label={t(language, 'Buying')}><Icon name="building" size={17} /><span>{t(language, 'Buying')}</span></a>
        <a className="sidebar-nav-link sidebar-market-link" href="#post-property" aria-label={t(language, 'Selling')}><Icon name="arrow" size={17} /><span>{t(language, 'Selling')}</span></a>
        <HoverHint text={t(language, 'View your saved properties.')} placement="right"><button className="sidebar-nav-link sidebar-icon-action" type="button" title={t(language, 'Favorites')} aria-label={t(language, 'Favorites')} onClick={() => goTo('properties')}><Icon name="heart" size={17} /><span>{t(language, 'Favorites')}</span></button></HoverHint>
        <HoverHint text={t(language, 'Check your latest updates.')} placement="right"><button className="sidebar-nav-link sidebar-icon-action notification-action" type="button" title={t(language, 'Notifications')} aria-label={t(language, 'Notifications')}><Icon name="bell" size={17} /><span>{t(language, 'Notifications')}</span><b>0</b></button></HoverHint>
      </nav><div className="sidebar-account">
        <HoverHint text={t(language, 'Access your Umutungo account.')} placement="right"><button className={`sidebar-nav-link ${isSignedIn ? 'sidebar-account-link' : 'sidebar-sign-in'}`} type="button" title={t(language, isSignedIn ? 'Account' : 'Sign in')} aria-label={t(language, isSignedIn ? 'Account' : 'Sign in')} onClick={isSignedIn ? onAccount : onSignIn}>{isSignedIn && <Icon name="user" size={17} />}<span>{t(language, isSignedIn ? 'Account' : 'Sign in')}</span></button></HoverHint>
      </div></div>
    </aside>
    <header className={`topbar ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="topbar-inner">
        <a className="topbar-brand" href="#home" aria-label="Umutungo home"><Logo /></a>
        <form className="topbar-search" role="search" onSubmit={(event) => { event.preventDefault(); goTo('properties'); }}><Icon name="search" size={18} /><input aria-label={t(language, 'Search')} type="search" placeholder={t(language, 'Search homes, land or spaces')} value={quickSearch} onChange={(event) => setQuickSearch(event.target.value)} /><button type="submit" aria-label={t(language, 'Search')}><Icon name="arrow" size={14} /></button></form>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a className="nav-link active" href="#home"><Icon name="home" size={17} /><span>{t(language, 'Home')}</span></a>
          <Dropdown label={role || t(language, 'Who Am I')} icon="users" items={roles.map((item) => t(language, item))} active={role} onSelect={setRole} />
          <Dropdown label={category || t(language, 'Categories')} icon="building" items={categories.map((item) => t(language, item))} active={category} onSelect={(value) => { setCategory(value); goTo('properties'); }} />
          <HoverHint text={t(language, 'Share a property with people looking.')} placement="bottom"><a className="nav-link nav-post" href="#post-property">{t(language, 'Post a Property')} <span>↗</span></a></HoverHint>
        </nav>
        <div className="nav-actions"><div className="nav-utility-group" aria-label="Site preferences"><Dropdown label={languageCodes[language]} icon="globe" items={languages} active={language} onSelect={(value) => onLanguageChange(value as Language)} /><ThemeToggle darkMode={darkMode} onToggle={onToggleTheme} language={language} /></div><button className="mobile-menu-button" type="button" aria-expanded={mobileOpen} aria-controls="mobile-menu" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} onClick={() => setMobileOpen(!mobileOpen)}><Icon name={mobileOpen ? 'x' : 'menu'} size={22} /></button></div>
      </div>
      {mobileOpen && <div className="mobile-menu" id="mobile-menu">
        <a className="mobile-menu-link active" href="#home" onClick={() => setMobileOpen(false)}>{t(language, 'Home')}</a>
        <div className="mobile-menu-group"><button className="mobile-menu-link" type="button" onClick={() => setMobileRoleOpen(!mobileRoleOpen)}>{t(language, 'Who Am I')} <Icon name="chevron" size={14} /></button>{mobileRoleOpen && <div className="mobile-submenu">{roles.map((item) => <button key={item} type="button" onClick={() => { setRole(item); setMobileOpen(false); }}>{t(language, item)}{role === item && <Icon name="check" size={14} />}</button>)}</div>}</div>
        <div className="mobile-menu-group"><button className="mobile-menu-link" type="button" onClick={() => setMobileCategoryOpen(!mobileCategoryOpen)}>{t(language, 'Categories')} <Icon name="chevron" size={14} /></button>{mobileCategoryOpen && <div className="mobile-submenu mobile-category-submenu">{categories.map((item) => <button key={item} type="button" onClick={() => { setCategory(item); goTo('properties'); }}>{t(language, item)}{category === item && <Icon name="check" size={14} />}</button>)}</div>}</div>
        <a className="mobile-menu-link" href="#post-property" onClick={() => setMobileOpen(false)}>{t(language, 'Post a Property')} <span>↗</span></a>
        <div className="mobile-menu-group"><button className="mobile-menu-link" type="button" onClick={() => setMobileLanguageOpen(!mobileLanguageOpen)}>{t(language, 'Language')} <span><Icon name="globe" size={13} /> {languageCodes[language]}</span></button>{mobileLanguageOpen && <div className="mobile-submenu mobile-language-submenu">{languages.map((item) => <button key={item} type="button" onClick={() => { onLanguageChange(item); setMobileOpen(false); }}>{item}{language === item && <Icon name="check" size={14} />}</button>)}</div>}</div>
      </div>}
    </header>
  </>;
}
