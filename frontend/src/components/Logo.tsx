import Image from 'next/image';

export function Logo() {
  return <Image className="brand-logo" src="/logo-transparent.png" alt="Umutungo" width={170} height={85} priority quality={100} sizes="(max-width: 600px) 94px, 138px" />;
}
