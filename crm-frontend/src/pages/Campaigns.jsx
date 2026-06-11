import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Send, Bot, AlertCircle } from 'lucide-react'

export default function Campaigns() {
  const [segments, setSegments] = useState([])
  const [formData, setFormData] = useState({ name: '', segment_id: '', channel: 'Email', message: '' })
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const res = await axios.get(`${API_URL}/api/segments`)
        setSegments(res.data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchSegments()
  }, [])

  const handleGenerateMessage = async () => {
    if (!formData.segment_id) {
      setError('Please select a segment first.')
      return
    }
    const segment = segments.find(s => s.id === formData.segment_id)
    
    setGenerating(true)
    setError('')
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const res = await axios.post(`${API_URL}/api/ai/message`, {
        channel: formData.channel,
        segment_description: segment.query_description
      })
      setFormData({ ...formData, message: res.data.message })
    } catch (err) {
      setError('Failed to generate message via AI.')
    }
    setGenerating(false)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    setSending(true)
    setError('')
    setSuccess('')
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      await axios.post(`${API_URL}/api/campaigns`, formData)
      setSuccess('Campaign created and messages are being sent!')
      setFormData({ name: '', segment_id: '', channel: 'Email', message: '' })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send campaign.')
    }
    setSending(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Create Campaign</h2>
        <p className="text-gray-500 mt-1">Target your segments with personalized messages.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={handleSend} className="space-y-6">
          
          {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg flex gap-2 items-center"><AlertCircle size={20}/> {error}</div>}
          {success && <div className="p-4 bg-green-50 text-green-700 rounded-lg flex gap-2 items-center">🎉 {success}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
            <input
              required
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Summer Sale 2024"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Segment</label>
              <select
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={formData.segment_id}
                onChange={e => setFormData({...formData, segment_id: e.target.value})}
              >
                <option value="">Select a segment...</option>
                {segments.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.customer_count} users)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={formData.channel}
                onChange={e => setFormData({...formData, channel: e.target.value})}
              >
                <option value="Email">Email</option>
                <option value="SMS">SMS</option>
                <option value="WhatsApp">WhatsApp</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Message Copy</label>
              <button
                type="button"
                onClick={handleGenerateMessage}
                disabled={generating}
                className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1 bg-purple-50 px-3 py-1 rounded-full transition-colors"
              >
                {generating ? <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"/> : <Bot size={16}/>}
                Generate with AI
              </button>
            </div>
            <textarea
              required
              rows={4}
              maxLength={160}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="Write your message here..."
              value={formData.message}
              onChange={e => setFormData({...formData, message: e.target.value})}
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {formData.message.length}/160
            </div>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {sending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={20} />}
            Send Campaign
          </button>
        </form>
      </div>
    </div>
  )
}
