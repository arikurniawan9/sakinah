import React from 'react';
import Link from 'next/link';

const StatCard = ({ title, value, icon: Icon, bgColorClass, textColorClass, darkMode, href, loading = false, warning = false, compact = false }) => {
  // Validasi nilai sebelum ditampilkan
  const displayValue = value !== undefined && value !== null ? value : 0;

  // Tentukan kelas default jika tidak disediakan
  let defaultBgColor = darkMode ? 'bg-indigo-600' : 'bg-indigo-500';

  // Gunakan warna peringatan jika warning=true
  if (warning) {
    defaultBgColor = darkMode ? 'bg-yellow-600' : 'bg-yellow-500';
  }

  const actualBgColor = bgColorClass || defaultBgColor;

  const content = (
    <div className={`${compact ? 'p-4' : 'p-6'} rounded-xl shadow-md relative overflow-hidden transition-all duration-300 ${
      href ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : ''
    } ${actualBgColor}`}>
      {/* Glossy Overlay Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
      
      {/* Background Icon */}
      <div className={`absolute -right-2 ${compact ? '-bottom-1' : '-bottom-2'} opacity-20 text-white`}>
        <Icon size={compact ? 60 : 80} strokeWidth={1} />
      </div>

      <div className="relative z-10 flex flex-col">
        <h3 className={`${compact ? 'text-[10px]' : 'text-sm'} font-medium truncate text-white/80 uppercase tracking-wider`}>
          {title}
        </h3>
        {loading ? (
          <div className={`${compact ? 'h-5 w-14' : 'h-7 w-20'} bg-white/20 rounded animate-pulse mt-1`}></div>
        ) : (
          <p className={`${compact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl lg:text-2xl'} font-extrabold text-white mt-0.5 break-words leading-tight drop-shadow-sm`}>
            {typeof displayValue === 'number' && isNaN(displayValue) ? 0 : displayValue}
          </p>
        )}
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
};

export default StatCard;
