import React from 'react';

export const BrandBadge = ({ children }) => (
  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl3 text-white bg-brand-blue shadow-neon animate-glow">
    <span className="w-2 h-2 rounded-full bg-brand-yellow animate-pulse" />
    <span className="font-extrabold tracking-wide">{children}</span>
  </div>
);

export const GradientTitle = ({ title, subtitle }) => (
  <div className="relative">
    <div className="absolute -inset-2 rounded-3xl bg-brand-gradient-1 opacity-60 blur-2xl" />
    <h1 className="relative text-5xl sm:text-6xl font-black bg-clip-text text-transparent bg-brand-gradient-1 animate-shimmer bg-[length:200%_200%]">
      {title}
    </h1>
    {subtitle && (
      <p className="mt-3 text-lg text-brand-blue/80">
        {subtitle}
      </p>
    )}
  </div>
);

export const OrbBackground = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden">
    <div className="absolute -top-12 -left-12 w-80 h-80 rounded-full bg-brand-orange opacity-30 blur-3xl animate-floaty" />
    <div className="absolute top-10 -right-10 w-96 h-96 rounded-full bg-brand-pink opacity-30 blur-3xl animate-floaty" />
    <div className="absolute bottom-10 left-24 w-72 h-72 rounded-full bg-brand-yellow opacity-40 blur-3xl animate-floaty" />
    <div className="absolute bottom-0 right-24 w-64 h-64 rounded-full bg-brand-lime opacity-30 blur-3xl animate-floaty" />
  </div>
);

export const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl ${className}`}>
    {children}
  </div>
);

export const CTAButton = ({ children, onClick, color = 'orange' }) => {
  const map = {
    orange: 'from-brand-orange to-brand-pink',
    lime: 'from-brand-lime to-brand-yellow',
    blue: 'from-brand-blue to-brand-pink',
  };
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center w-full py-4 px-6 rounded-2xl text-white font-bold shadow-neon transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 bg-gradient-to-r ${map[color]}`}
    >
      {children}
    </button>
  );
};

export const Section = ({ children, className = '' }) => (
  <section className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>{children}</section>
);


