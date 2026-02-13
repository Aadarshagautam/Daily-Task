import { MoreHorizontal, Trash2, Calendar, Clock } from 'lucide-react'
import React, { useState } from 'react'
import { formatDate } from '../Pages/lib/utils'
import { Link } from 'react-router-dom'
import api from '../Pages/lib/axios'
import toast from 'react-hot-toast'

const NoteCard = ({ note, setNotes, viewMode = 'grid' }) => {
    const [isDeleting, setIsDeleting] = useState(false)
    const [showMenu, setShowMenu] = useState(false)

    const handleDelete = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        if (!window.confirm("Delete this note?")) return
        
        setIsDeleting(true)
        try {
            await api.delete(`/notes/${note._id}`)
            setNotes((prevNotes) => (
                Array.isArray(prevNotes)
                    ? prevNotes.filter(n => n._id !== note._id)
                    : []
            ))
            toast.success("Note deleted")
        } catch (error) {
            console.error("Error deleting note:", error)
            toast.error("Failed to delete note")
        } finally {
            setIsDeleting(false)
        }
    }

    const truncatedContent = note.content.length > 120 
        ? note.content.substring(0, 120) + '...' 
        : note.content

    // Grid View
    if (viewMode === 'grid') {
        return (
            <Link 
                to={`/notes/${note._id}`} 
                className="block bg-white rounded-lg p-5 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
            >
                <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-lg font-semibold text-slate-900 line-clamp-2 flex-1">
                        {note.title || "Untitled"}
                    </h3>
                    
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setShowMenu(!showMenu)
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                        
                        {showMenu && (
                            <>
                                <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setShowMenu(false)
                                    }}
                                />
                                <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                    {truncatedContent || "No content"}
                </p>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(new Date(note.createdAt))}</span>
                </div>
            </Link>
        )
    }

    // List View
    return (
        <Link 
            to={`/notes/${note._id}`} 
            className="block bg-white rounded-lg p-4 border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
        >
            <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-slate-900 truncate mb-1">
                        {note.title || "Untitled"}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-1 mb-2">
                        {truncatedContent || "No content"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(new Date(note.createdAt))}</span>
                    </div>
                </div>

                <div className="relative flex-shrink-0">
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setShowMenu(!showMenu)
                        }}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                    
                    {showMenu && (
                        <>
                            <div 
                                className="fixed inset-0 z-10" 
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setShowMenu(false)
                                }}
                            />
                            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Link>
    )
}

export default NoteCard
