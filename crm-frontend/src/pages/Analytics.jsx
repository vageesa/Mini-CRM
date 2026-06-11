import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Activity, Mail, CheckCircle2, MessageSquare, XCircle, MousePointerClick } from 'lucide-react'

export default function Analytics() {
  const [campaigns, setCampaigns] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const res = await axios.get(`${API_URL}/api/campaigns`)
        setCampaigns(res.data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchCampaigns()
  }, [])

  useEffect(() => {
    if (!selectedId) return
    const fetchStats = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const res = await axios.get(`${API_URL}/api/campaigns/${selectedId}/stats`)
        setStats(res.data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchStats()
    // Poll every 5 seconds for updates
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [selectedId])

  const calculatePercentage = (value, total) => {
    if (!total || total === 0) return 0
    return Math.round((value / total) * 100)
  }

  const StatCard = ({ title, value, total, icon: Icon, colorClass }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{value || 0}</h3>
        </div>
        <div className={`p-3 rounded-lg ${colorClass}`}>
          <Icon size={20} />
        </div>
      </div>
      {total > 0 && title !== 'Total Sent' && (
        <div className="mt-4">
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${colorClass.replace('bg-', 'bg-').replace('text-', '')}`} 
              style={{ width: `${calculatePercentage(value, total)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">{calculatePercentage(value, total)}% of total</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex h-full gap-8">
      {/* Left List */}
      <div className="w-1/3 flex flex-col h-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Campaigns</h2>
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex-1 overflow-y-auto">
          {campaigns.map(c => (
            <div 
              key={c.id} 
              onClick={() => setSelectedId(c.id)}
              className={`p-5 border-b border-gray-100 cursor-pointer transition-colors ${selectedId === c.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}
            >
              <h3 className="font-bold text-gray-900">{c.name}</h3>
              <div className="flex gap-2 items-center mt-2 text-xs text-gray-500">
                <span className="bg-gray-200 px-2 py-1 rounded text-gray-700 font-medium">{c.channel}</span>
                <span>•</span>
                <span>{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          {campaigns.length === 0 && <div className="p-8 text-center text-gray-500 italic">No campaigns found.</div>}
        </div>
      </div>

      {/* Right Stats */}
      <div className="w-2/3">
        {selectedId && stats ? (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="text-blue-600" /> Live Analytics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <StatCard title="Total Audience" value={stats.total} total={stats.total} icon={Mail} colorClass="bg-blue-100 text-blue-600" />
              <StatCard title="Delivered" value={stats.delivered} total={stats.total} icon={CheckCircle2} colorClass="bg-green-100 text-green-600" />
              <StatCard title="Opened" value={stats.opened} total={stats.total} icon={MessageSquare} colorClass="bg-purple-100 text-purple-600" />
              <StatCard title="Clicked" value={stats.clicked} total={stats.total} icon={MousePointerClick} colorClass="bg-yellow-100 text-yellow-600" />
              <StatCard title="Failed" value={stats.failed} total={stats.total} icon={XCircle} colorClass="bg-red-100 text-red-600" />
              <StatCard title="Processing" value={stats.sent + (stats.processing || 0)} total={stats.total} icon={Activity} colorClass="bg-gray-100 text-gray-600" />
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-400">Select a campaign to view live analytics.</p>
          </div>
        )}
      </div>
    </div>
  )
}
