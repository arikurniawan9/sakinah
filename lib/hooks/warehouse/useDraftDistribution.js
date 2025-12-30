import { useState, useEffect } from 'react';

export function useDraftDistribution() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDrafts = async (storeId = null) => {
    setLoading(true);
    setError(null);
    
    try {
      let url = '/api/warehouse/distribution/draft';
      if (storeId) {
        url += `?storeId=${storeId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengambil draft distribusi');
      }
      
      setDrafts(data.drafts || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching drafts:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async (storeId, items, notes = '') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/warehouse/distribution/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeId,
          items,
          notes,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan draft distribusi');
      }
      
      // Refresh daftar draft
      await fetchDrafts(storeId);
      
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error saving draft:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateDraft = async (draftId, storeId, items, notes = '') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/warehouse/distribution/draft', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          draftId,
          storeId,
          items,
          notes,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Gagal memperbarui draft distribusi');
      }
      
      // Refresh daftar draft
      await fetchDrafts(storeId);
      
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error updating draft:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteDraft = async (draftId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/warehouse/distribution/draft?draftId=${draftId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghapus draft distribusi');
      }
      
      // Refresh daftar draft
      setDrafts(prev => prev.filter(draft => draft.id !== draftId));
      
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error deleting draft:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    drafts,
    loading,
    error,
    fetchDrafts,
    saveDraft,
    updateDraft,
    deleteDraft,
  };
}