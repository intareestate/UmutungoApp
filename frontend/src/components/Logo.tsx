import Image from 'next/image';

export function Logo() {
  return <Image className="brand-logo" src="/logo-transparent.png" alt="Umutungo" width={146} height={51} priority />;
}
