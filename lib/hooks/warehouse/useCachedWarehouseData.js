import useSWR from 'swr';

// Fetcher function for SWR
const fetcher = (...args) => fetch(...args).then(res => res.json());

export function useCachedWarehouseData() {
  // Cache stores data
  const {
    data: storesData,
    error: storesError,
    isLoading: storesLoading,
    mutate: mutateStores
  } = useSWR('/api/warehouse/stores', fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000, // 5 seconds deduplication
    // Cache for 10 minutes
    focusThrottleInterval: 10000,
  });

  // Cache warehouse users data
  const {
    data: usersData,
    error: usersError,
    isLoading: usersLoading,
    mutate: mutateUsers
  } = useSWR('/api/warehouse/users?role=ATTENDANT', fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000, // 5 seconds deduplication
    // Cache for 10 minutes
    focusThrottleInterval: 10000,
  });

  return {
    stores: storesData?.stores || [],
    storesLoading,
    storesError,
    mutateStores,
    
    warehouseUsers: usersData?.users || [],
    usersLoading: usersLoading,
    usersError,
    mutateUsers,
    
    isLoading: storesLoading || usersLoading,
    hasError: storesError || usersError,
  };
}