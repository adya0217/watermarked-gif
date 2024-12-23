import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [search, setSearch] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const downloadGif = async (gif) => {
    try {
      const watermarkResponse = await axios.post('/api/watermark', {
        imageUrl: gif.images.fixed_width_small.url,
      }, {
        timeout: 20000
      });

      const base64Data = watermarkResponse.data.watermarkedImage;

      // Create and trigger download
      const link = document.createElement('a');
      link.href = base64Data;  // Use base64 data directly
      link.download = `${gif.title || 'watermarked'}.gif`;
      link.click();
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download GIF');
    }
  };

  const searchGifs = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    setLoading(true);
    setError(null);
    setGifs([]);

    try {
      const response = await axios.get(`/api/gifs?query=${encodeURIComponent(search)}`);
      const gifData = response.data.data.slice(0, 20);
      setGifs(gifData);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to fetch GIFs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-black">
          Search Gif
        </h1>

        <form onSubmit={searchGifs} className="mb-8">
          <div className="flex gap-2 justify-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border rounded-md w-64 text-black placeholder-black"
              placeholder="Search for GIFs..."
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Search'}
            </button>
          </div>
        </form>

        {error && (
          <div className="text-red-500 text-center mb-4">{error}</div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {gifs.map((gif) => (
            <div key={gif.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-2">
                <img
                  src={gif.images.fixed_width_small.url}
                  alt={gif.title}
                  className="w-full h-auto rounded"
                  style={{ maxWidth: '200px', margin: '0 auto' }}
                />
              </div>
              <div className="px-2 pb-2">
                <button
                  onClick={() => downloadGif(gif)}
                  className="w-full px-2 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center justify-center gap-1 text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
