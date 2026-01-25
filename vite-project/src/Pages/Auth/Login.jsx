import React,{useState,useContext} from 'react'
import {useNavigate } from 'react-router-dom';
import { AppContext } from "../../context/AppContext";
import axios from 'axios';
import {toast} from 'react-hot-toast';


const Login = () => {

  const navigate = useNavigate();
  const {backendUrl, setIsLoggedin,getUserData}=React.useContext(AppContext);


  const [state, setState] = useState('Sign Up');
  const [username, setUsername]= useState('');
  const [email, setEmail]= useState('');
  const [password, setPassword]= useState('');

  const handleSubmit= async(e)=>{
    try {
      e.preventDefault();

      axios.defaults.withCredentials=true;

      if(state==='Sign Up'){
        // Check if all fields are filled for Sign Up
        if (!username || !email || !password) {
          toast.error("Please fill in all fields");
          return;
        }
        console.log("Sending data:", { username, email, password }); // ✅ ADD THIS LINE
       const {data}= await axios.post(backendUrl+'/api/auth/register',{username, email, password});
       console.log("Response:", data); // ✅ ADD THIS LINE
       if(data.success){
        setIsLoggedin(true);
        getUserData();
        navigate('/');
        toast.success('Account created successfully!'); // ✅ Added success message

       }else{
        toast.error(data.message); // ✅ Fixed: was toast.alert(error.message)
      }

      } else{
         // Login - only send email and password
         if (!email || !password) {
          toast.error("Please fill in all fields");
          return;
        }
        console.log("Sending login data:", { email, password }); // ✅ Only email and password
        const {data}= await axios.post(backendUrl+'/api/auth/login',{email, password});
        console.log("Response:", data);
       if(data.success){
        setIsLoggedin(true);
        getUserData();
        navigate('/');
        toast.success('Logged in successfully!'); // ✅ Added success message
       }else{
        toast.error(data.message); // ✅ Fixed: was toast.alert(error.message)
      }

      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.response?.data?.message || error.message);    }
  }
  return (
    <div className="flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br from-blue-200 to-purple-400">
      <div className="bg-slate-900 p-10 rounded-lg shadow-lg w-full sm:w-96 text-indigo-300 text-sm ">
      <h2 className="text-3xl font-semibold text-white text-center mb-3">{state==='Sign Up'? 'Create Account':'Login'}</h2>
      <p className="text-center text-sm mb-6">{state==='Sign Up'? 'Create your account':'Login to your accounr!'}</p>
      <form onSubmit={handleSubmit}>
        
        {state==='Sign Up' && (
        <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]'>
          <input onChange={e => setUsername(e.target.value)} value={username} className="bg-transparent outline-none w-full text-white" type="text" placeholder="Full Name" required />
        </div>
      )}
        <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#33A5C]'>
          <input onChange={e => setEmail(e.target.value)} value={email} className="bg-transparent outline-none w-full text-white" type="email" placeholder="Email id" autoComplete="username"  required />
        </div>
        <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#33A5C]'>
          <input onChange={e => setPassword(e.target.value)} value={password} className="bg-transparent outline-none w-full text-white" type="password" placeholder="Password" autoComplete="current-password" required />
        </div>
        <p onClick={()=>navigate("/reset-password")} className='mb-4 text-indigo-500 cursor-pointer'>Foreget password?</p>
        <button className='w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900'>{state}</button>
      </form>
       {/* Toggle between Sign Up and Login */}
      {state ==='Sign Up'?(<p className='text-gray-400 text-center text-xs mt-4'>Already have an account?{''}
        <span onClick={()=>setState('Login')} className='text-blue-400 cursor-pointer underline'>Login here</span>
      </p>):(<p className='text-gray-400 text-center text-xs mt-4'>Don't have an account?{''}
        <span onClick={()=>setState('Sign Up')} className='text-blue-400 cursor-pointer underline'>Sign Up</span>
      </p>)}
      
      
      </div>

    </div>
  )
}

export default Login