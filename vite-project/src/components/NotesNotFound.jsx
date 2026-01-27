import React from 'react';
import { FileText, Plus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotesNotFound = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] py-16 px-4">
            <div className="max-w-md w-full text-center space-y-8">
                {/* Animated Icon */}
                <div className="relative inline-flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 blur-3xl opacity-20 animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-full border border-indigo-500/30">
                        <FileText className="w-16 h-16 text-indigo-400" strokeWidth={1.5} />
                        <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-purple-400 animate-pulse" />
                    </div>
                </div>

                {/* Heading */}
                <div className="space-y-3">
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        No Notes Yet
                    </h3>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Your creative space is waiting! Start capturing your ideas, thoughts, and inspirations.
                    </p>
                </div>

                {/* Features */}
                <div className="grid gap-3 text-left bg-slate-900/50 rounded-lg p-6 border border-indigo-500/20">
                    <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2"></div>
                        <p className="text-sm text-gray-400">Organize your thoughts effortlessly</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-purple-400 mt-2"></div>
                        <p className="text-sm text-gray-400">Access your notes anytime, anywhere</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-pink-400 mt-2"></div>
                        <p className="text-sm text-gray-400">Keep track of important information</p>
                    </div>
                </div>

                {/* CTA Button */}
                <Link 
                    to="/create" 
                    className="group inline-flex items-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    Create Your First Note
                </Link>
            </div>
        </div>
    )
}

export default NotesNotFound