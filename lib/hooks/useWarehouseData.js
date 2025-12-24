// lib/hooks/useWarehouseData.js
import useSWR from 'swr';

/**
 * A generic fetcher function for SWR.
 * It takes a URL, fetches the JSON data, and throws an error if the response is not ok.
 * @param {string} url The URL to fetch data from.
 * @returns {Promise<any>} The JSON data from the response.
 */
export const fetcher = async (url) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object.
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }

  return res.json();
};

/**
 * Fetches warehouse statistics.
 * @returns {{stats: object, isLoading: boolean, isError: boolean}}
 */
export function useWarehouseStats() {
  const { data, error, isLoading } = useSWR('/api/warehouse/stats', fetcher);

  return {
    stats: data,
    isLoading,
    isError: error,
  };
}

/**
 * Fetches recent warehouse distributions based on a date range.
 * @param {Date} startDate The start date of the range.
 * @param {Date} endDate The end date of the range.
 * @param {number} limit The maximum number of records to fetch.
 * @returns {{distributions: Array, isLoading: boolean, isError: boolean}}
 */
export function useRecentDistributions(startDate, endDate, limit = 5) {
  // Only fetch if both dates are valid
  const shouldFetch = startDate && endDate;
  
  // SWR key will be null if we should not fetch, preventing the request.
  const key = shouldFetch 
    ? `/api/warehouse/distribution?limit=${limit}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}` 
    : null;

  const { data, error, isLoading } = useSWR(key, fetcher);

  return {
    distributions: data?.distributions || [],
    isLoading,
    isError: error,
  };
}
