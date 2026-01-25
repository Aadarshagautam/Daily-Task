import React, { useContext, useState } from 'react'
import { data, useNavigate } from 'react-router-dom'
import { AppContext } from "../../context/AppContext";
import toast from 'react-hot-toast';

const ResetPassword = () => {

const {backendUrl}= useContext(AppContext)
axios.defaults.withCredentials= true
  const navigate = useNavigate();
  const [email,setEmail]= useState('')
  const [newPassword,setNewPassword]= useState('')
  const [isEmailSent, setIsEmailSent] = useState('')
  const [otp, setotp] = useState(0)
  const [isotpSubmited, setisotpSubmited] = useState(false)

   const inputRef = React.useRef([])
  
   const handleInput = (index) =>{
    if(e.target.value.length>0 && index<inputRef.current.length-1){
      inputRef.current[index+1].focus()
    }
   }
   const handleKeyDown=(index, e)=>{
    if(e.key === 'Backspace' && e.target.value===''&& index>0){{
      inputRef.current[index-1].focus()
    }
   }
   } 
   const handlePaste=(e)=>{
    const paste= e.clipboardData.getData('text')
    const pasteArray= paste.split('')
    pasteArray.forEach((char, index)=>{
      if(inputRef.current[index]){
        inputRef.current[index].value=char
      }
   })
  }

  const onSubmitEmail= async(e)=>{
    e.preventDefault();
    try {
      const{data} = await axios.post(backendUrl + '/api/auth/send-reset-otp',{email})
      data.success ? toast.success(data.message):toast.error(data.message)
      data.success && setIsEmailSent(true)

    } catch (error) {
      toast.error(error.message)
    }
  }
  const onSubmitOtp=async(e)=>{
    e.preventDefault();
    const otpArray=inputRef.current.map(e=>e.value)
    setisotpSubmited(true)
  }
  const onSubmitNewPassword=async(e)=>{
    e.preventDefault();
    try {
      const{data}=await axios.post(backendUrl+'/api/auth/reset-password',{email,otp,newPassword})
      data.success? toast.success(data.message):toast.error(data.message)
      data.success && navigate('/login')

      
    } catch (error) {
      toast.error(error.message)
    }
  }
  return (
    <div className="flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br from -blue-200 to-purple-400">
      {/* enter email id */}
      {!isEmailSent &&
      <form onSubmit={onSubmitEmail} className='bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm'>
      <h1 className='text-white text-2xl font-semibold text-center mb-4'>Reset password</h1>
          <p className='text-center mb-6 text-indigo-300'>
Enter your register email address
          </p>
          <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5'>
            <input type="email"placeholder='Email id' className='bg-transparent outline-none text-white' value={email} onChange={e=>setEmail(e.target.value)} required/>
          </div>
          <button className='w-full py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-full mt-3'>Submit</button>
      </form>
      }

{/* OTP input form */}
{!isotpSubmited && isEmailSent && 
<form onSubmit={onSubmitOtp}className='bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm'>
        <h1 className='text-white text-2xl font-semibold text-center mb-4'>Reset Password OTP</h1>
          <p className='text-center mb-6 text-indigo-300'>
Enter the 6-digit code sent to your email address to verify your account.
          </p>
        <div className='flex justify-between mb-8' onPaste={handlePaste}>
          {Array(6).fill(0).map((_, index)=>{
            <input type="text" maxLength='1' key={index} required className='w-12 h-12 bg-[#333A5C] text-white text-center text-xl rounded-md' 
            ref={el => inputRef.current[index] = el}
            onInput={(e)=>handleInput(e.index)}
            onKeyDown={(e)=>handleKeyDown(e.index)}

            />
          })}
        </div>
<button className='w-full py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-full'>Submit</button>
      </form>
    }

      {/* Enter new password */}
      {isotpSubmited && isEmailSent && 
      <form onSubmit={onSubmitNewPassword} className='bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm'>
      <h1 className='text-white text-2xl font-semibold text-center mb-4'>Reset password</h1>
          <p className='text-center mb-6 text-indigo-300'>
Enter the new password 
          </p>
          <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5'>
            <input type="password"placeholder='Password' className='bg-transparent outline-none text-white' value={newPassword} onChange={e=>setNewPasswordS(e.target.value)} required/>
          </div>
          <button className='w-full py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-full mt-3'>Submit</button>
      </form>
      }
    </div>
  )
}

export default ResetPassword