// components/warehouse/distribution/LazyDistributionDetails.js
import { lazy, Suspense } from 'react';
import LoadingSpinner from '../../LoadingSpinner';

const LazyDistributionDetails = lazy(() => import('./DistributionDetails'));

const LazyDistributionDetailsWithSuspense = (props) => (
  <Suspense fallback={
    <div className={`p-4 rounded-lg shadow-lg ${props.darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex flex-col items-center justify-center p-12">
        <LoadingSpinner message="Memuat komponen detail distribusi..." size="large" />
      </div>
    </div>
  }>
    <LazyDistributionDetails {...props} />
  </Suspense>
);

export default LazyDistributionDetailsWithSuspense;