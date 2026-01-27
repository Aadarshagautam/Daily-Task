import { PenSquare, Trash2, Calendar, Clock } from 'lucide-react'
import React, { useState } from 'react'
import { formatDate } from '../Pages/lib/utils'
import { Link } from 'react-router-dom'
import api from '../Pages/lib/axios';
import toast from 'react-hot-toast';

const NoteCard = ({ note, setNotes }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();

        if (!window.confirm("Are you sure you want to delete this note?")) return;
        
        setIsDeleting(true);
        try {
            await api.delete(`/notes/${id}`)
            setNotes((prevNotes) => prevNotes.filter(note => note._id !== id))
            toast.success("Note deleted successfully")
        } catch (error) {
            console.error("Error deleting note:", error)
            toast.error("Failed to delete note")
        } finally {
            setIsDeleting(false);
        }
    };

    // Truncate content to 100 characters
    const truncatedContent = note.content.length > 100 
        ? note.content.substring(0, 100) + '...' 
        : note.content;

    return (
        <Link 
            to={`/notes/${note._id}`} 
            className="group relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 border border-indigo-500/20 hover:border-indigo-500/40 transform hover:-translate-y-1"
        >
            {/* Accent line at top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-xl"></div>
            
            <div className="space-y-4">
                {/* Title */}
                <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                    {note.title}
                </h3>

                {/* Content Preview */}
                <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">
                    {truncatedContent}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(new Date(note.createdAt))}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // Add edit functionality here
                            }}
                            className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-all duration-200"
                            title="Edit note"
                        >
                            <PenSquare className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => handleDelete(e, note._id)}
                            disabled={isDeleting}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 disabled:opacity-50"
                            title="Delete note"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Hover overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 rounded-xl transition-all duration-300 pointer-events-none"></div>
        </Link>
    )
}

export default NoteCard