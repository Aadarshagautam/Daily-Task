import React, { use } from 'react'
import { PlusIcon } from 'lucide-react'
import { Link } from 'react-router-dom' 
import { useContext } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'



const Navbar = () => {

  const navigate=useNavigate();
  const {userData, backendUrl, setUserData, setIsLoggedin}=useContext(AppContext);

  const sendVerificationOtp=async()=>{
    try {
      axios.defaults.withCredentials=true;
      const {data}=await axios.post(backendUrl+"/api/user/send-verification-otp");
      if(data.success){
        toast.success(data.message);
        navigate('/email-verifty');
      } else{
        toast.error(data.message);
      }
      
    } catch (error) {
      toast.error(error.message);
      
    }
  }

  const logout=async()=>{
    try {
    axios.defaults.withCredentials=true;
    const {data}=await axios.post(backendUrl+"/api/logout");
    data.success && setIsLoggedin(false);
    data.success && setUserData(false);
    navigate('/login');
      
    } catch (error) {
      toast.error(error.message);
      
    }
  }
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
  <div className='w-8 h-8 flex justify-center items-center  rounded-full bg-black text-white relative group'>
{userData.name[0].toUpperCase()};
<div className='absolute hidden group-hover:block top-0 right-0 z-10 text-black rounded pt-10'>
  <ul className='list-none m-0 p-2 bg-gray-100 text-sm '>
    {!userData.isAccountVerified && 
    <li onClick={sendVerificationOtp} className='py-1 px-2 hover:bg-gray-200'> verify email</li>}
    <li onClick={logout} className='py-1 px-2 hover:bg-gray-200 cursor-pointer pr-10'>Logout</li>
  </ul>
</div>
  </div>
  : <button onClick={()=>navigate('/login')} className="flex items-center gap-2 border border-gray-500 rounded-full px-6 py-2 text-gray-800 hover:bg-gray-100">Login</button>

    </div>
        </header>
  )
}

export default Navbar