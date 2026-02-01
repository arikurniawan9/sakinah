// Debug page untuk menguji API retur produk
// File: app/admin/debug-return-api/page.js

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function DebugReturnApiPage() {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const testApi = async () => {
      try {
        console.log('Testing API connection...');
        
        // Test basic connectivity
        const response = await fetch('/api/return-products');
        const data = await response.json();
        
        setDebugInfo({
          status: response.status,
          statusText: response.statusText,
          data: data,
          timestamp: new Date().toISOString()
        });
        
        console.log('API Response:', data);
      } catch (err) {
        console.error('API Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    testApi();
  }, []);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Debug API Retur Produk</h1>
      
      {loading && (
        <div className="text-center py-8">
          <p>Menguji koneksi API...</p>
        </div>
      )}
      
      {error && (
        <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h2 className="font-bold mb-2">Error:</h2>
          <p>{error}</p>
        </div>
      )}
      
      {debugInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Hasil Debug API</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Status HTTP:</h3>
                <p>{debugInfo.status} {debugInfo.statusText}</p>
              </div>
              
              <div>
                <h3 className="font-medium">Timestamp:</h3>
                <p>{debugInfo.timestamp}</p>
              </div>
              
              <div>
                <h3 className="font-medium">Response Data:</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(debugInfo.data, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}