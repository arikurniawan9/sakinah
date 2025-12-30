import { useState, useEffect } from 'react';

export function useDistributionTemplate() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTemplates = async (storeId = null, templateName = null) => {
    setLoading(true);
    setError(null);
    
    try {
      let url = '/api/warehouse/distribution/template';
      const params = new URLSearchParams();
      
      if (storeId) params.append('storeId', storeId);
      if (templateName) params.append('templateName', templateName);
      
      if ([...params.keys()].length > 0) {
        url += '?' + params.toString();
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengambil template distribusi');
      }
      
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async (name, storeId, items, notes = '') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/warehouse/distribution/template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          storeId,
          items,
          notes,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan template distribusi');
      }
      
      // Refresh daftar template
      await fetchTemplates(storeId);
      
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error saving template:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTemplate = async (templateId, name, storeId, items, notes = '') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/warehouse/distribution/template', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId,
          name,
          storeId,
          items,
          notes,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Gagal memperbarui template distribusi');
      }
      
      // Refresh daftar template
      await fetchTemplates(storeId);
      
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error updating template:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (templateId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/warehouse/distribution/template?templateId=${templateId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghapus template distribusi');
      }
      
      // Refresh daftar template
      setTemplates(prev => prev.filter(template => template.id !== templateId));
      
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error deleting template:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
  };
}