import React from 'react'
import { useNavigate } from 'react-router-dom'

const ResetPassword = () => {

  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br from -blue-200 to-purple-400">
      {/* enter email id */}
      <form className='bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm'>
      <h1 className='text-white text-2xl font-semibold text-center mb-4'>Reset password</h1>
          <p className='text-center mb-6 text-indigo-300'>
Enter your register email address
          </p>
          <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5'>
            <input type="email" />
          </div>
      </form>
    </div>
  )
}

export default ResetPassword