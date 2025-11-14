// components/Breadcrumb.js
import Link from 'next/link';

export default function Breadcrumb({ items, darkMode = false }) {
  return (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <Link href="/admin" className={`inline-flex items-center text-sm font-medium ${
            darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-700 hover:text-gray-900'
          }`}>
            <svg className="w-3 h-3 mr-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="m19 19H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5v11l4-2 6 6V1a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1Z"/>
            </svg>
            Dashboard
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="inline-flex items-center">
            <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
            </svg>
            {index === items.length - 1 ? (
              <span className={`ml-1 text-sm font-medium ${
                darkMode ? 'text-gray-500' : 'text-gray-500'
              } md:ml-2`}>
                {item.title}
              </span>
            ) : (
              <Link href={item.href} className={`ml-1 text-sm font-medium ${
                darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-700 hover:text-gray-900'
              } md:ml-2`}>
                {item.title}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}