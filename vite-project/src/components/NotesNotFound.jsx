import React from 'react'
import { StickyNote, Plus, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const NotesNotFound = () => {
  return (
    <div className="flex items-center justify-center py-20 px-4">
      <div className="text-center max-w-md">
        {/* Animated Icon */}
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-indigo-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
          <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-full">
            <StickyNote className="w-16 h-16 text-white" />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles className="w-8 h-8 text-yellow-400 animate-bounce" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          No Notes Yet
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          Start capturing your thoughts, ideas, and important information. 
          Create your first note to get organized!
        </p>

        {/* Features */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
          <p className="text-sm font-semibold text-gray-900 mb-3">What you can do:</p>
          <ul className="space-y-2 text-sm text-gray-700 text-left">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
              Create unlimited notes
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
              Organize your thoughts
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
              Access from anywhere
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
              Keep everything secure
            </li>
          </ul>
        </div>

        {/* CTA Button */}
        <Link
          to="/create"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          Create Your First Note
        </Link>
      </div>
    </div>
  )
}

export default NotesNotFound