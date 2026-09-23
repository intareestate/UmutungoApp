import { ReactElement, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Language, t } from '../data/translations';
import { Icon } from './Icons';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { AuthModal, AuthRole } from './AuthModal';

type NavbarProps = {
  darkMode: boolean;
  onToggleTheme: () => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
  isSignedIn?: boolean;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onAccount?: () => void;
  onLandingVisibilityChange?: (visible: boolean) => void;
};

const authRoles = ['Tenant', 'Commissioner / Komisiyoneri', 'Landlord', 'Admin'];
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

  return <div className="nav-dropdown" ref={ref}><button className={`nav-link nav-dropdown-trigger ${open ? 'is-open' : ''}`} type="button" aria-expanded={open} onClick={toggleMenu}>{icon && <Icon name={icon} size={16} />}<span>{label}</span><Icon name="chevron" size={12} /></button>{open && <div className="dropdown-panel" style={menuPosition ? { position: 'fixed', top: menuPosition.top, right: menuPosition.right } : undefined}>{items.map((item) => <button key={item} className={active === item ? 'selected' : ''} type="button" onClick={() => { onSelect(item); setOpen(false); }}>{item}{active === item && <Icon name="check" size={15} />}</button>)}</div>}</div>;
}

function AccountPanel({ language, role, darkMode, onToggleTheme, onLanguageChange, onAccount, onFavorites, onSignOut }: { language: Language; role?: string; darkMode: boolean; onToggleTheme: () => void; onLanguageChange: (language: Language) => void; onAccount: () => void; onFavorites: () => void; onSignOut: () => void }) {
  return <div className="account-panel" role="menu">
    <div className="account-panel-heading"><Icon name="user" size={19} /><span><strong>{role ? t(language, role) : t(language, 'Account')}</strong><small>Umutungo account</small></span></div>
    <button className="account-panel-item" type="button" role="menuitem" onClick={onAccount}><Icon name="user" size={16} /><span>{t(language, 'Account')}</span><Icon name="arrow" size={14} /></button>
    <button className="account-panel-item" type="button" role="menuitem" onClick={onFavorites}><Icon name="heart" size={16} /><span>{t(language, 'Favorites')}</span><Icon name="arrow" size={14} /></button>
    <div className="account-panel-divider" />
    <span className="account-panel-label">{t(language, 'Settings')}</span>
    <ThemeToggle darkMode={darkMode} onToggle={onToggleTheme} language={language} />
    <label className="account-panel-language"><span><Icon name="globe" size={16} />{t(language, 'Language')}</span><select value={language} onChange={(event) => onLanguageChange(event.target.value as Language)}>{languages.map((item) => <option key={item} value={item}>{languageCodes[item]}</option>)}</select></label>
    <div className="account-panel-divider" />
    <button className="account-panel-item account-panel-logout" type="button" role="menuitem" onClick={onSignOut}><Icon name="arrow" size={16} /><span>{t(language, 'Log out')}</span></button>
  </div>;
}

export function Navbar({ darkMode, onToggleTheme, language, onLanguageChange, isSignedIn = false, onSignIn, onSignOut, onAccount, onLandingVisibilityChange }: NavbarProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [landingVisible, setLandingVisible] = useState(true);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [mobileLanguageOpen, setMobileLanguageOpen] = useState(false);
  const [roleKey, setRoleKey] = useState('');
  const [quickSearch, setQuickSearch] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const mobileAccountMenuRef = useRef<HTMLDivElement>(null);
  const [pendingRole, setPendingRole] = useState<AuthRole | undefined>();
  const [intendedPath, setIntendedPath] = useState<string | undefined>();
  const [demoSignedIn, setDemoSignedIn] = useState(false);
  const signedIn = isSignedIn || demoSignedIn;
  const isTenant = roleKey === 'Tenant';
  const postActionLabel = isTenant ? 'Upgrade to Post' : 'Post a Property';
  const postActionHint = isTenant ? 'Post (Upgrade)' : 'Share a property with people looking.';
  const goTo = (id: string) => { setMobileOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };
  const openCategory = (value: string) => {
    const category = categories.find((item) => t(language, item) === value) ?? value;
    const slugs: Record<string, string> = { Houses: 'houses', Apartments: 'apartments', Land: 'land', Commercial: 'commercial', Offices: 'offices', Equipment: 'equipment', Hospitality: 'hospitality' };
    if (slugs[category]) window.location.assign(`/categories/${slugs[category]}`);
  };

  useEffect(() => {
    ['/tenant', '/commissioner', '/landlord', '/admin'].forEach((path) => router.prefetch(path));
  }, [router]);

  useEffect(() => {
    const storedUser = window.localStorage.getItem('umutungo-demo-user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as { role?: string };
        if (authRoles.includes(parsed.role ?? '')) {
          setDemoSignedIn(true);
          setRoleKey(parsed.role ?? '');
        }
      } catch {
        window.localStorage.removeItem('umutungo-demo-user');
      }
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const landing = document.getElementById('home');
    if (!landing) return;
    const observer = new IntersectionObserver(([entry]) => {
      const visible = entry.isIntersecting;
      setLandingVisible(visible);
      onLandingVisibilityChange?.(visible);
    }, { threshold: 0.15 });
    observer.observe(landing);
    return () => observer.disconnect();
  }, [onLandingVisibilityChange]);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => { const target = event.target as Node; if (!accountMenuRef.current?.contains(target) && !mobileAccountMenuRef.current?.contains(target)) setAccountMenuOpen(false); };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setAccountMenuOpen(false); };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('mousedown', closeOnOutsideClick); document.removeEventListener('keydown', closeOnEscape); };
  }, [accountMenuOpen]);

  const openSignIn = (requestedRole?: AuthRole, returnTo?: string) => {
    setPendingRole(requestedRole);
    setIntendedPath(returnTo);
    setAuthOpen(true);
  };

  useEffect(() => {
    const requestSignIn = (event: Event) => {
      const requestedRole = (event as CustomEvent<{ role?: AuthRole }>).detail?.role;
      const returnTo = (event as CustomEvent<{ returnTo?: string }>).detail?.returnTo;
      if (signedIn) {
        if (requestedRole === 'Commissioner / Komisiyoneri' && roleKey === requestedRole) router.push('/commissioner');
        return;
      }
      openSignIn(requestedRole ?? 'Tenant', returnTo);
    };
    window.addEventListener('umutungo:request-sign-in', requestSignIn);
    return () => window.removeEventListener('umutungo:request-sign-in', requestSignIn);
  }, [signedIn]);

  const signOut = () => {
    window.localStorage.removeItem('umutungo-demo-user');
    setDemoSignedIn(false);
    setRoleKey('');
    setAccountMenuOpen(false);
    setMobileOpen(false);
    onSignOut?.();
  };

  const openAccount = () => {
    setAccountMenuOpen(false);
    if (onAccount) { onAccount(); return; }
    const dashboardPaths: Record<string, string> = { Tenant: '/tenant', 'Commissioner / Komisiyoneri': '/commissioner', Landlord: '/landlord', Admin: '/admin' };
    if (dashboardPaths[roleKey]) router.push(dashboardPaths[roleKey]);
  };

  const openMarket = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!signedIn) { event.preventDefault(); setMobileOpen(false); openSignIn('Tenant'); }
  };
  const searchCategory = (value: string) => {
    const query = value.toLowerCase();
    if (/\b(apartment|apartments|flat|flats|studio)\b/.test(query)) return 'apartments';
    if (/\b(land|plot|plots|farm|farmland)\b/.test(query)) return 'land';
    if (/\b(commercial|office|offices|shop|shops|warehouse|workspace|retail)\b/.test(query)) return 'commercial';
    return 'houses';
  };
  const submitQuickSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = quickSearch.trim();
    if (!query) { goTo('properties'); return; }
    window.location.assign(`/categories/${searchCategory(query)}?q=${encodeURIComponent(query)}`);
  };
  const postAction = <a className={`nav-link nav-post ${isTenant ? 'nav-post-upgrade' : ''}`} href={isTenant ? '/upgrade' : '/post-property'} onClick={(event) => { if (!signedIn) { event.preventDefault(); setMobileOpen(false); openSignIn('Landlord', '/post-property'); } }} aria-label={t(language, postActionHint)}><span className="nav-post-label">{t(language, postActionLabel)}</span></a>;

  return <>
    <aside className={`site-header ${scrolled ? 'is-scrolled' : ''} ${landingVisible ? '' : 'is-hidden'}`}>
      <div className="sidebar-shell"><nav className="sidebar-nav" aria-label="Property navigation">
        <a className="sidebar-nav-link sidebar-market-link" href="#properties" onClick={openMarket}><Icon name="home" size={17} /><span>{t(language, 'Rent')}</span></a>
        <a className="sidebar-nav-link sidebar-market-link" href="#properties" onClick={openMarket}><Icon name="building" size={17} /><span>{t(language, 'Buy')}</span></a>
        <a className="sidebar-nav-link sidebar-market-link" href="#post-property"><Icon name="arrow" size={17} /><span>{t(language, 'Commercial')}</span></a>
        <HoverHint text={t(language, 'View your saved properties.')} placement="right"><button className="sidebar-nav-link sidebar-icon-action" type="button" title={t(language, 'Favorites')} aria-label={t(language, 'Favorites')} onClick={() => goTo('properties')}><Icon name="heart" size={17} /><span>{t(language, 'Favorites')}</span></button></HoverHint>
        <HoverHint text={t(language, 'Check your latest updates.')} placement="right"><button className="sidebar-nav-link sidebar-icon-action notification-action" type="button" title={t(language, 'Notifications')} aria-label={t(language, 'Notifications')}><Icon name="bell" size={17} /><span>{t(language, 'Notifications')}</span><b>0</b></button></HoverHint>
      </nav><div className="sidebar-account"><HoverHint text={t(language, 'Access your Umutungo account.')} placement="right"><button className={`sidebar-nav-link ${signedIn ? 'sidebar-account-link' : 'sidebar-sign-in'}`} type="button" title={t(language, signedIn ? 'Log out' : 'Sign in')} aria-label={t(language, signedIn ? 'Log out' : 'Sign in')} onClick={signedIn ? signOut : () => (onSignIn ? onSignIn() : openSignIn())}>{signedIn && <Icon name="user" size={17} />}<span>{t(language, signedIn ? 'Log out' : 'Sign in')}</span></button></HoverHint></div></div>
    </aside>

    <header className={`topbar ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="topbar-inner">
        <a className="topbar-brand" href="/" aria-label="Umutungo home"><Logo /></a>
        <form className="topbar-search" role="search" onSubmit={submitQuickSearch}><span className="search-magic"><Icon name="sparkles" size={15} /></span><Icon name="search" size={16} /><input aria-label={t(language, 'Search')} type="search" placeholder="Find a house near stadium" value={quickSearch} onChange={(event) => setQuickSearch(event.target.value)} /><button type="submit" aria-label={t(language, 'Search')}><Icon name="arrow" size={13} /></button></form>

        <nav className="desktop-nav" aria-label="Primary navigation">
          <a className="nav-link active" href="/"><Icon name="home" size={16} /><span>{t(language, 'Home')}</span></a>
          <Dropdown label={t(language, 'Categories')} items={categories.map((item) => t(language, item))} onSelect={openCategory} icon="building" />
          <HoverHint text={t(language, postActionHint)} placement="bottom">{postAction}</HoverHint>
        </nav>

        <div className="nav-actions">
          <button className="nav-saved" type="button" title={t(language, 'Favorites')} aria-label={t(language, 'Favorites')} onClick={() => goTo('properties')}><Icon name="heart" size={17} /></button>
          <div className="nav-utility-group" aria-label="Site preferences"><Dropdown label={languageCodes[language]} items={languages} active={language} onSelect={(value) => onLanguageChange(value as Language)} icon="globe" /><ThemeToggle darkMode={darkMode} onToggle={onToggleTheme} language={language} /></div>
          <div className="account-menu-wrap" ref={accountMenuRef}>
            <button className={`nav-sign-in ${signedIn ? 'nav-account' : ''}`} type="button" title={t(language, signedIn ? 'Account' : 'Sign in')} aria-label={t(language, signedIn ? 'Account' : 'Sign in')} aria-expanded={signedIn ? accountMenuOpen : undefined} onClick={signedIn ? () => setAccountMenuOpen((open) => !open) : () => (onSignIn ? onSignIn() : openSignIn())}>{signedIn && <Icon name="user" size={16} />}{t(language, signedIn ? 'Account' : 'Sign in')}{signedIn && <Icon name="chevron" size={12} />}</button>
            {signedIn && accountMenuOpen && <AccountPanel language={language} role={roleKey} darkMode={darkMode} onToggleTheme={onToggleTheme} onLanguageChange={onLanguageChange} onAccount={openAccount} onFavorites={() => { setAccountMenuOpen(false); goTo('properties'); }} onSignOut={signOut} />}
          </div>
          <span className="mobile-post-action">{postAction}</span>
          <button className="mobile-menu-button" type="button" aria-expanded={mobileOpen} aria-controls="mobile-menu" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} onClick={() => setMobileOpen(!mobileOpen)}><Icon name={mobileOpen ? 'x' : 'menu'} size={22} /></button>
        </div>
      </div>

      {mobileOpen && <div className="mobile-menu" id="mobile-menu">
        <a className="mobile-menu-link active" href="/" onClick={() => setMobileOpen(false)}>{t(language, 'Home')}</a>
        <div className="mobile-menu-group"><button className="mobile-menu-link" type="button" onClick={() => setMobileCategoryOpen(!mobileCategoryOpen)}>{t(language, 'Categories')} <Icon name="chevron" size={14} /></button>{mobileCategoryOpen && <div className="mobile-submenu mobile-language-submenu">{categories.map((item) => <button key={item} type="button" onClick={() => openCategory(t(language, item))}>{t(language, item)}</button>)}</div>}</div>
        <div className="mobile-account-menu-wrap" ref={mobileAccountMenuRef}>
          <button className="mobile-menu-link mobile-sign-in-link" type="button" aria-expanded={signedIn ? accountMenuOpen : undefined} onClick={signedIn ? () => setAccountMenuOpen((open) => !open) : () => { setMobileOpen(false); onSignIn ? onSignIn() : openSignIn(); }}>{t(language, signedIn ? 'Account' : 'Sign in')}<Icon name={signedIn && accountMenuOpen ? 'chevron' : 'user'} size={15} /></button>
          {signedIn && accountMenuOpen && <AccountPanel language={language} role={roleKey} darkMode={darkMode} onToggleTheme={onToggleTheme} onLanguageChange={onLanguageChange} onAccount={openAccount} onFavorites={() => { setAccountMenuOpen(false); goTo('properties'); }} onSignOut={signOut} />}
        </div>
        <div className="mobile-menu-group"><button className="mobile-menu-link" type="button" onClick={() => setMobileLanguageOpen(!mobileLanguageOpen)}>{t(language, 'Language')} <span><Icon name="globe" size={13} /> {languageCodes[language]}</span></button>{mobileLanguageOpen && <div className="mobile-submenu mobile-language-submenu">{languages.map((item) => <button key={item} type="button" onClick={() => { onLanguageChange(item); setMobileOpen(false); }}>{item}{language === item && <Icon name="check" size={14} />}</button>)}</div>}</div>
      </div>}
    </header>
    <AuthModal open={authOpen} role={pendingRole} onClose={() => { setAuthOpen(false); setIntendedPath(undefined); }} onSuccess={(accountRole) => { setDemoSignedIn(true); setRoleKey(accountRole); setAuthOpen(false); const paths: Record<string, string> = { Tenant: '/tenant', 'Commissioner / Komisiyoneri': '/commissioner', Landlord: '/landlord', Admin: '/admin' }; const destination = intendedPath ?? (pendingRole && paths[pendingRole]) ?? paths[accountRole] ?? '/'; setIntendedPath(undefined); router.push(destination); }} />
  </>;
}
