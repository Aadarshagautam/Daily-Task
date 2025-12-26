import React from 'react';
import { Notebook, NotebookIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotesNotFound = () => {
    return (
        <div className="flex flex-col items-center  justify-center py-16 space-y-6 max-w-md mx-auto text-center">
            <div className="bg-primary/10 text-primary">
                <NotebookIcon className="size-10 text-primary" />


            </div>
            <h3 className="text-2xl font-bold">
                No Notes Found

            </h3>
            <p className="text-base-content/70"> Ready to organize your thoughts? Create your first note to Started on your journey </p>
            <Link to={"/create"} className="btn btn-primary ">Create Your First Note</Link>

        </div>
    )
}

export default NotesNotFound