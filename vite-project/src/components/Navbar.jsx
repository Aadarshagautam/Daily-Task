import React from 'react'
import { PlusIcon } from 'lucide-react'
import { Link } from 'react-router-dom' 


const Navbar = () => {
  return (
    <header className="bg-base-300 border-b border-base-content/10 ">
<div className="mx-auto max-w-6xl p-4">
<div className="flex items-center justify-between">
<h1 className="text-3xl font-bold text-primary font-mono tracking-tight">
ThinkBoard
</h1>

<div className="flex items-center gap-4">
<Link to={"/create"} className="btn btn-primary">
<PlusIcon className="size-5" />
<span> New Note</span>
</Link>

</div>
</div>
</div>
// Navbar for Login page
<div className="w-full flex justify-between items-center p-4 sm:p-6 sm:px-24 absolute top-0">
        <button className="flex items-center gap-2 border border-gray-500 rounded-full px-6 py-2 text-gray-800 hover:bg-gray-100">Login</button>

    </div>
        </header>
  )
}

export default Navbar