import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Sparkles, Save, Code } from 'lucide-react'

export default function Segmentation() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [segmentName, setSegmentName] = useState('')
  const [savedSegments, setSavedSegments] = useState([])

  const fetchSegments = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const res = await axios.get(`${API_URL}/api/segments`)
      setSavedSegments(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchSegments()
  }, [])

  const handleGenerate = async () => {
    if (!query) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const res = await axios.post(`${API_URL}/api/ai/segment`, { query })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate segment. Try rephrasing.')
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!segmentName || !result) return
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      await axios.post(`${API_URL}/api/segments`, {
        name: segmentName,
        query_description: query,
        sql_where_clause: result.sql_where_clause
      })
      setSegmentName('')
      setResult(null)
      setQuery('')
      fetchSegments()
    } catch (err) {
      setError('Failed to save segment.')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">AI Segmentation</h2>
        <p className="text-gray-500 mt-1">Use natural language to filter your audience.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex gap-4">
          <input
            type="text"
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg"
            placeholder="e.g. Customers from Mumbai who spent over ₹5000"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !query}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={20} />}
            Generate
          </button>
        </div>

        {error && <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">{error}</div>}

        {result && (
          <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                <div className="text-blue-600 font-semibold uppercase tracking-wider text-sm mb-1">Audience Size</div>
                <div className="text-4xl font-bold text-blue-900">{result.customer_count.toLocaleString()} <span className="text-xl font-normal text-blue-700">customers</span></div>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="text-gray-500 font-semibold uppercase tracking-wider text-sm mb-2 flex items-center gap-2"><Code size={16}/> Generated SQL</div>
                <code className="text-sm text-pink-600 font-mono break-all">{result.sql_where_clause}</code>
              </div>
            </div>

            <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
              <input
                type="text"
                placeholder="Give this segment a name..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={segmentName}
                onChange={e => setSegmentName(e.target.value)}
              />
              <button
                onClick={handleSave}
                disabled={!segmentName}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                Save Segment
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Saved Segments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedSegments.map(seg => (
            <div key={seg.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-gray-900">{seg.name}</h4>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">{seg.customer_count} users</span>
              </div>
              <p className="text-sm text-gray-500 italic mb-3">"{seg.query_description}"</p>
              <code className="text-xs bg-gray-100 text-gray-600 p-2 rounded block truncate" title={seg.sql_where_clause}>
                {seg.sql_where_clause}
              </code>
            </div>
          ))}
          {savedSegments.length === 0 && <div className="text-gray-500 italic">No segments saved yet.</div>}
        </div>
      </div>
    </div>
  )
}
