// components/warehouse/distribution/LazyDistributionProductSearch.js
import { lazy, Suspense } from 'react';
import LoadingSpinner from '../../LoadingSpinner';

const LazyDistributionProductSearch = lazy(() => import('./DistributionProductSearch'));

const LazyDistributionProductSearchWithSuspense = (props) => (
  <Suspense fallback={
    <div className="flex flex-col h-full">
      <div className={`rounded-lg shadow p-4 mb-4 ${props.darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="relative">
          <div className={`w-full pl-10 pr-4 py-2 border rounded-md ${
            props.darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'
          }`}>
            <div className="flex justify-center items-center p-8">
              <LoadingSpinner message="Memuat komponen pencarian produk..." />
            </div>
          </div>
        </div>
      </div>
    </div>
  }>
    <LazyDistributionProductSearch {...props} />
  </Suspense>
);

export default LazyDistributionProductSearchWithSuspense;