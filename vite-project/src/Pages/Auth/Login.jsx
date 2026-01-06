import React,{useState} from 'react'

const Login = () => {
  const [state, setState] = useState('Sign Up');
  return (
    <div className="flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br from -blue-200 to-purple-400">
      <div className="bg-slate-900 p-10 rounded-lg shadow-lg w-full sm:w-96 text-indigo-300 text-sm ">
      <h2 className="text-3xl font-semibold text-white text-center mb-3">{state==='Sign Up'? 'Create Account':'Login'}</h2>
      <p className="text-center text-sm mb-6">{state==='Sign Up'? 'Create your account':'Login to your accounr!'}</p>
      <form>
        <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#33A5C]'>
          <input className="bg-transparent outline-none" type="text" placeholder="Full Name" required />
        </div>
        <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#33A5C]'>
          <input className="bg-transparent outline-none" type="email" placeholder="Email id" required />
        </div>
        <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#33A5C]'>
          <input className="bg-transparent outline-none" type="password" placeholder="Password" required />
        </div>
        <p className='mb-4 text-indigo-500 cursor-pointer'>Foreget password?</p>
      </form>
      </div>

    </div>
  )
}

export default Login