import axios from "axios";
import { createContext, useState, useEffect } from "react";
import toast from "react-hot-toast";


export const AppContext = createContext();


export const AppContextProvider=(props)=>{

    axios.defaults.withCredentials=true;
    const backendUrl=import.meta.env.VITE_BACKEND_URL;
    const [isLoggedin, setIsLoggedin]=useState(false);
    const [userData, setUserData]=useState(null);

    const getAuthState=async()=>{
        try {
            const {data}= await axios.get(backendUrl+'/api/auth/is-auth');
            if(data.success){
                setIsLoggedin(true);
                getUserData();

            }
        } catch (error) {
            setIsLoggedin(false);            
        }
    }

    const getUserData= async()=>{
        try {
            const {data}= await axios.get(backendUrl+'/api/user/data');
            data.success?setUserData(data.user):toast.error(data.message);
        } catch (error) {
            setIsLoggedin(false);        }
    }
useEffect(()=>{
    getAuthState();
},[])
    const value={
        backendUrl,
        isLoggedin,setIsLoggedin,
        userData,setUserData,
        getUserData

    }
return( 

<AppContext.Provider value={value}>
    {props.children}
</AppContext.Provider>
);
};