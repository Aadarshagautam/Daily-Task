import { MoreHorizontal, Trash2, Calendar, Eye } from 'lucide-react'
import React, { useState } from 'react'
import { formatDate } from '../Pages/lib/utils'
import { Link } from 'react-router-dom'
import api from '../Pages/lib/axios'
import toast from 'react-hot-toast'

const NoteCard = ({ note, setNotes, viewMode = 'grid' }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const handleDelete = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!window.confirm("Delete this note? This action cannot be undone.")) return;
        
        setIsDeleting(true);
        try {
            await api.delete(`/notes/${note._id}`)
            setNotes((prevNotes) => prevNotes.filter(n => n._id !== note._id))
            toast.success("Note deleted")
        } catch (error) {
            console.error("Error deleting note:", error)
            toast.error("Failed to delete note")
        } finally {
            setIsDeleting(false);
        }
    };

    // Truncate content
    const truncatedContent = note.content.length > 150 
        ? note.content.substring(0, 150) + '...' 
        : note.content;

    // Get first line for preview
    const firstLine = note.content.split('\n')[0];
    const preview = firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;

    // Grid View
    if (viewMode === 'grid') {
        return (
            <Link 
                to={`/notes/${note._id}`} 
                className="group relative bg-white rounded-xl p-6 hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-indigo-300 transform hover:-translate-y-1"
            >
                {/* Color accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-xl"></div>
                
                <div className="space-y-3 mt-2">
                    {/* Title & Menu */}
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 group-hover:text-indigo-600 transition-colors">
                            {note.title || "Untitled"}
                        </h3>
                        
                        {/* Menu Button */}
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowMenu(!showMenu);
                                }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                            
                            {/* Dropdown Menu */}
                            {showMenu && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-10" 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setShowMenu(false);
                                        }}
                                    />
                                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                                        <button
                                            onClick={handleDelete}
                                            disabled={isDeleting}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            {isDeleting ? 'Deleting...' : 'Delete note'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Content Preview */}
                    <p className="text-sm text-gray-600 line-clamp-4 leading-relaxed">
                        {truncatedContent || "No content"}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs text-gray-500">
                                {formatDate(new Date(note.createdAt))}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                        </div>
                    </div>
                </div>

                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 rounded-xl transition-all duration-300 pointer-events-none"></div>
            </Link>
        )
    }

    // List View
    return (
        <Link 
            to={`/notes/${note._id}`} 
            className="group relative bg-white rounded-lg p-5 hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-indigo-300 flex items-center gap-4"
        >
            {/* Left accent */}
            <div className="w-1 h-16 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full flex-shrink-0"></div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors mb-1">
                    {note.title || "Untitled"}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                    {preview || "No content"}
                </p>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-4 flex-shrink-0">
                {/* Date */}
                <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(new Date(note.createdAt))}</span>
                </div>

                {/* Menu */}
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                    
                    {showMenu && (
                        <>
                            <div 
                                className="fixed inset-0 z-10" 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowMenu(false);
                                }}
                            />
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {isDeleting ? 'Deleting...' : 'Delete note'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Link>
    )
}

export default NoteCard;