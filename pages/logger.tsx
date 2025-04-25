import { useEffect, useState } from "react"
import { 
  fetchProducts, 
  fetchCategories, 
  fetchDiscounts, 
  fetchOrders,
  clearCaches 
} from "@/lib/api-utils"

// API base URL from the same place api-utils uses it
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://omnimart-api.onrender.com';

export default function LoggerPage() {
  const [loading, setLoading] = useState(true)
  const [apiData, setApiData] = useState<Record<string, any>>({})
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Function to directly fetch from an endpoint to avoid cache
  async function fetchDirectFromApi(endpoint: string) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      return { error: String(err) };
    }
  }

  useEffect(() => {
    async function fetchAllApiData() {
      try {
        const results: Record<string, any> = {}
        
        setLoading(true)
        
        // Direct API calls - bypass cache completely
        results['/api/products'] = await fetchDirectFromApi('/api/products');
        results['/api/categories'] = await fetchDirectFromApi('/api/categories');
        results['/api/discounts'] = await fetchDirectFromApi('/api/discounts');
        results['/api/orders'] = await fetchDirectFromApi('/api/orders');
        
        // Utility function calls - these use the cache
        try {
          results['utils/products'] = await fetchProducts();
        } catch (err) {
          results['utils/products'] = { error: String(err) };
        }
        
        try {
          results['utils/categories'] = await fetchCategories();
        } catch (err) {
          results['utils/categories'] = { error: String(err) };
        }
        
        try {
          results['utils/discounts'] = await fetchDiscounts();
        } catch (err) {
          results['utils/discounts'] = { error: String(err) };
        }
        
        setApiData(results);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }
    
    fetchAllApiData();
  }, [refreshKey]);

  const handleRefresh = () => {
    clearCaches(); // Clear api-utils caches
    setRefreshKey(prev => prev + 1); // Trigger useEffect again
  };

  if (loading) return <div className="p-6">Loading API data...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">API Endpoints Logger</h1>
      
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600">Data from API: {API_BASE_URL}</p>
        <button 
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Refresh Data (Clear Cache)
        </button>
      </div>
      
      {Object.keys(apiData).map(endpoint => (
        <div key={endpoint} className="mb-8">
          <h2 className="text-xl font-semibold mb-2 flex items-center">
            <span className="mr-2">{endpoint}</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {Array.isArray(apiData[endpoint]) 
                ? `${apiData[endpoint].length} items` 
                : 'object'}
            </span>
          </h2>
          
          <div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
            <pre className="text-sm">
              {JSON.stringify(apiData[endpoint], null, 2)}
            </pre>
          </div>
        </div>
      ))}
      
      <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-medium mb-2">API Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>Base URL:</strong> {API_BASE_URL}</p>
            <p><strong>Direct API calls:</strong> These fetch directly from the API</p>
            <p><strong>Utility calls:</strong> These use the api-utils.ts functions (with caching)</p>
          </div>
          <div>
            <p><strong>Total Endpoints:</strong> {Object.keys(apiData).length}</p>
            <p><strong>Total Direct API Objects:</strong> {
              Object.entries(apiData)
                .filter(([key]) => key.startsWith('/api/'))
                .reduce((acc, [_, val]) => 
                  acc + (Array.isArray(val) ? val.length : 1), 0)
            }</p>
          </div>
        </div>
      </div>
    </div>
  );
}
