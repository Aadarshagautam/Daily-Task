import React, { useContext } from 'react'
import axios from 'axios'
import { AppContext } from '../../Context/AppContext'


const EmailVerifty = () => {

  const {backendUrl}=useContext(AppContext)
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

const onSubmitHandler=async(e)=>{
  try {
    
    e.preventDefault()
    const otpArray=inputRef.current.map(e=>e.value)
    const otp=otpArray.join('')
    const {data}=await axios.past()
  
  } catch (error) {
    
  }
}
  return (
    <div className="flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br from -blue-200 to-purple-400">
      <form className='bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm'>
        <h1 className='text-white text-2xl font-semibold text-center mb-4'>Email Verify OTP</h1>
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
<button className='w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-full'>Verify email</button>
      </form>
    </div>
  )
}

export default EmailVerifty;