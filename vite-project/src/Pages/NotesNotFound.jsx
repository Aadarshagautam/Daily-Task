import React from 'react'
import { StickyNote, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

const NotesNotFound = () => {
  return (
    <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <StickyNote className="w-8 h-8 text-indigo-600" />
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        No Notes Yet
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-sm mx-auto">
        Start capturing your ideas and thoughts by creating your first note
      </p>

      <Link
        to="/create"
        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        <Plus className="w-5 h-5" />
        Create Your First Note
      </Link>
    </div>
  )
}

export default NotesNotFound