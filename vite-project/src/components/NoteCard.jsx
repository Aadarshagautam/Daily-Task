import { PenSquareIcon, Trash2Icon } from 'lucide-react'
import React from 'react'
import { formatDate } from '../Pages/lib/utils'
import { Link } from 'react-router-dom'
import api from '../Pages/lib/axios';
import toast from 'react-hot-toast';



const NoteCard = ({ note, setNotes }) => {
    const handleDelete= async(e,id)=>{
        e.preventDefault(); // Prevents navigation to the note detail page

if(!window.confirm ("Are you sure you want to detele this note?")) return;
try{
 await api.delete(`/notes/${id}`)
 setNotes((prevNotes)=> prevNotes.filter(note=> note._id !== id)) // Update the notes state to remove the deleted note
 toast.success("Note deleted successfullys")
} catch(error){
Console.log("Error deleting note:",error)
toast.error ("Failed to delete note")
}
    };
    return (
        <Link to={`/notes/${note._id}`} className="card bg-base-100 hover:shadow-lg transition-all duration-200 border-t-4 border-solid border-[#00FF9D]">
            <div className="car-body ">
                <h3 className="card-title text-base-content ">{note.title}</h3>
                <p className="text-sm text-base-content/70 mt-3">{note.content}...</p>
                <div className="card-action justify-between items-center mt-4">
                    <span className="text-sm text-base-content/60">
                        {formatDate(new Date(note.createdAt))}
                    </span>
                    <div className="flex items-center gap-1">
                        <PenSquareIcon className="size-4" />
                        <button className="btn btn-ghost btn-xs text-error" onClick={(e)=>{handleDelete(e,note._id)}}>
                            <Trash2Icon className="size-4" />
                        </button>
                    </div>
                </div>
            </div>
        </Link>)
}

export default NoteCard