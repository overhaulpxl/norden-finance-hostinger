import Image from 'next/image';

type BrandLogoProps = {
  variant?: 'icon' | 'horizontal';
  className?: string;
  priority?: boolean;
  sizes?: string;
};

export default function BrandLogo({
  variant = 'horizontal',
  className = '',
  priority = false,
  sizes,
}: BrandLogoProps) {
  const isIcon = variant === 'icon';

  return (
    <Image
      src={isIcon ? '/brand/norden-icon.svg?v=2' : '/brand/norden-horizontal.svg?v=2'}
      alt={isIcon ? 'Norden Finance' : 'Norden Finance logo'}
      width={isIcon ? 755 : 1030}
      height={isIcon ? 755 : 360}
      priority={priority}
      sizes={sizes || (isIcon ? '80px' : '(max-width: 640px) 192px, 260px')}
      unoptimized
      className={`object-contain ${className}`}
    />
  );
}
