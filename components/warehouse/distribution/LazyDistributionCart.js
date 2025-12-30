// components/warehouse/distribution/LazyDistributionCart.js
import { lazy, Suspense } from 'react';
import LoadingSpinner from '../../LoadingSpinner';

const LazyDistributionCart = lazy(() => import('./DistributionCart'));

const LazyDistributionCartWithSuspense = (props) => (
  <Suspense fallback={
    <div className={`mt-6 ${props.darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
      <div className="flex flex-col items-center justify-center p-12">
        <LoadingSpinner message="Memuat komponen keranjang distribusi..." size="large" />
      </div>
    </div>
  }>
    <LazyDistributionCart {...props} />
  </Suspense>
);

export default LazyDistributionCartWithSuspense;