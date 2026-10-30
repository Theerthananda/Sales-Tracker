import React from 'react';

function Logo({ size = 'md', showText = true }) {
  const sizes = {
    sm: { container: 'w-8 h-8', img: 'w-8 h-8', text: 'text-lg', subtext: 'text-xs' },
    md: { container: 'w-10 h-10', img: 'w-10 h-10', text: 'text-2xl', subtext: 'text-xs' },
    lg: { container: 'w-16 h-16', img: 'w-16 h-16', text: 'text-4xl', subtext: 'text-sm' },
    xl: { container: 'w-24 h-24', img: 'w-24 h-24', text: 'text-6xl', subtext: 'text-2xl' },
  };

  const currentSize = sizes[size];

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="relative flex-shrink-0">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-white/30 rounded-xl blur-md"></div>
        {/* Logo Container */}
        <div className={`relative bg-white/95 backdrop-blur-sm p-1.5 sm:p-2 rounded-xl shadow-lg ${currentSize.container} flex items-center justify-center`}>
          <img 
            src="/Logo_img_rxgrwt.png" 
            alt="Swansorter Logo" 
            className={`${currentSize.img} object-contain`}
          />
        </div>
      </div>
      {showText && (
        <div className="hidden sm:block">
          <h1 className={`${currentSize.text} font-bold tracking-tight leading-tight`}>Swansorter</h1>
          <p className={`${currentSize.subtext} text-white/80 font-medium -mt-0.5 sm:-mt-1`}>Sales Tracker</p>
        </div>
      )}
    </div>
  );
}

export default Logo;
