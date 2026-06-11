import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Users, Filter, Send, BarChart2 } from 'lucide-react'

export default function Layout() {
  const location = useLocation()
  
  const navItems = [
    { name: 'Customers', path: '/', icon: <Users size={20} /> },
    { name: 'Segmentation', path: '/segmentation', icon: <Filter size={20} /> },
    { name: 'Campaigns', path: '/campaigns', icon: <Send size={20} /> },
    { name: 'Analytics', path: '/analytics', icon: <BarChart2 size={20} /> },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">Mini CRM</h1>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map(item => {
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
