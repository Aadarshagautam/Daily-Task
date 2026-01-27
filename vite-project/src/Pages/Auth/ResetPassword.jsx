import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from "../../context/AppContext";
import { Mail, Lock, ArrowLeft, Shield } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ResetPassword = () => {
    const { backendUrl } = useContext(AppContext)
    const navigate = useNavigate();
    
    const [email, setEmail] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [isEmailSent, setIsEmailSent] = useState(false)
    const [otp, setOtp] = useState('')
    const [isOtpSubmitted, setIsOtpSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)

    const inputRef = React.useRef([])

    const handleInput = (e, index) => {
        if (e.target.value.length > 0 && index < inputRef.current.length - 1) {
            inputRef.current[index + 1].focus()
        }
    }

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
            inputRef.current[index - 1].focus()
        }
    }

    const handlePaste = (e) => {
        const paste = e.clipboardData.getData('text')
        const pasteArray = paste.split('')
        pasteArray.forEach((char, index) => {
            if (inputRef.current[index]) {
                inputRef.current[index].value = char
            }
        })
    }

    const onSubmitEmail = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            axios.defaults.withCredentials = true;
            const { data } = await axios.post(backendUrl + '/api/auth/send-reset-otp', { email })
            if (data.success) {
                toast.success(data.message)
                setIsEmailSent(true)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        } finally {
            setLoading(false);
        }
    }

    const onSubmitOtp = async (e) => {
        e.preventDefault();
        const otpArray = inputRef.current.map(input => input.value)
        const otpValue = otpArray.join('')
        setOtp(otpValue)
        setIsOtpSubmitted(true)
    }

    const onSubmitNewPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            axios.defaults.withCredentials = true;
            const { data } = await axios.post(backendUrl + '/api/auth/reset-password', { email, otp, newPassword })
            if (data.success) {
                toast.success(data.message)
                navigate('/login')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen px-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Back button */}
            <button
                onClick={() => navigate('/login')}
                className="absolute top-8 left-8 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Login</span>
            </button>

            {/* Step 1: Enter Email */}
            {!isEmailSent && (
                <form onSubmit={onSubmitEmail} className='bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100'>
                    <div className="flex justify-center mb-6">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-full">
                            <Mail className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    
                    <h1 className='text-gray-900 text-3xl font-bold text-center mb-3'>Reset Password</h1>
                    <p className='text-center mb-8 text-gray-600'>
                        Enter your registered email address and we'll send you a verification code
                    </p>

                    <div className='mb-6'>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                placeholder='Enter your email'
                                className='w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all'
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className='w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        {loading ? 'Sending...' : 'Send Verification Code'}
                    </button>
                </form>
            )}

            {/* Step 2: Enter OTP */}
            {!isOtpSubmitted && isEmailSent && (
                <form onSubmit={onSubmitOtp} className='bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100'>
                    <div className="flex justify-center mb-6">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-full">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    <h1 className='text-gray-900 text-3xl font-bold text-center mb-3'>Enter Verification Code</h1>
                    <p className='text-center mb-8 text-gray-600'>
                        We've sent a 6-digit code to <span className="font-semibold text-indigo-600">{email}</span>
                    </p>

                    <div className='flex justify-center gap-2 mb-8' onPaste={handlePaste}>
                        {Array(6).fill(0).map((_, index) => (
                            <input
                                key={index}
                                type="text"
                                maxLength='1'
                                required
                                className='w-12 h-14 bg-gray-50 border-2 border-gray-300 text-gray-900 text-center text-xl font-semibold rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all'
                                ref={el => inputRef.current[index] = el}
                                onInput={(e) => handleInput(e, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        className='w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-300'
                    >
                        Verify Code
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsEmailSent(false)}
                        className="w-full mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        Change email address
                    </button>
                </form>
            )}

            {/* Step 3: Enter New Password */}
            {isOtpSubmitted && isEmailSent && (
                <form onSubmit={onSubmitNewPassword} className='bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100'>
                    <div className="flex justify-center mb-6">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-full">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    <h1 className='text-gray-900 text-3xl font-bold text-center mb-3'>Create New Password</h1>
                    <p className='text-center mb-8 text-gray-600'>
                        Choose a strong password to secure your account
                    </p>

                    <div className='mb-6'>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                placeholder='Enter new password'
                                className='w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all'
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                        <p className="mt-2 text-xs text-gray-500">Must be at least 6 characters long</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className='w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            )}
        </div>
    )
}

export default ResetPassword