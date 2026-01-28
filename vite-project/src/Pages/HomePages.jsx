import React, { useState, useEffect, useContext } from "react";
import Navbar from "../components/Navbar";
import RateLimitedUI from "../components/RateLimitedUI";
import { toast } from "react-hot-toast";
import NoteCard from "../components/NoteCard";
import api from "./lib/axios";
import NotesNotFound from "../components/NotesNotFound";
import { AppContext } from "../context/AppContext";

 

const HomePages = () => {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loading, setloading] = useState(false);
  const { userData, isLoggedin,authChecked } = useContext(AppContext); // ✅ Added isLoggedin here


  useEffect(() => {
    if (!authChecked) return; // ⛔ wait
  
    if (!isLoggedin) {
      console.log("User not logged in, skipping notes fetch");
      return;
    }
  
    const fetchNotes = async () => {
      setloading(true);
      try {
        const res = await api.get("/notes");
        setNotes(res.data);
        setIsRateLimited(false);
      } catch (error) {
        if (error.response?.status === 429) {
          setIsRateLimited(true);
        }
      } finally {
        setloading(false);
      }
    };
  
    fetchNotes();
  }, [authChecked, isLoggedin]);
  return (
    <div className="min-h-screen">
      <Navbar />
      {isRateLimited && <RateLimitedUI />}
      <div className="max-w-7xl mx-auto p-4 mt-6">
        {loading && (
          <div className="text-center text-primary py-10"> Loading notes....</div>
        )}
        {!isLoggedin && (
          <div className="text-center text-gray-500 py-10">
            Please log in to view your notes
          </div>
        )}
        {isLoggedin && notes.length === 0 && !isRateLimited && !loading && <NotesNotFound />}
        {notes.length > 0 && !isRateLimited && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <NoteCard key={note._id} note={note} setNotes={setNotes} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePages;
