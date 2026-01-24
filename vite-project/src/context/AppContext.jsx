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
            const {data}= await axios.get(backendUrl+'/api/auth/is-auth',{withCredentials:true});
            if(data.success){
                setIsLoggedin(true);
                getUserData(); // Fetch user data if authenticated

            }
        } catch (error) {
            console.error("Auth check failed:", error);
            setIsLoggedin(false);
            setUserData(null);          
        }
    }

    const getUserData= async()=>{
        try {
            const {data}= await axios.get(backendUrl+'/api/user/data',{ withCredentials: true });
            if (data.success) {
                setUserData(data.user);
            } else {
                toast.error(data.message);
            }
                } catch (error) {
                    console.error("Failed to fetch user data:", error);
                    toast.error("Failed to fetch user data");
                      }
    }
useEffect(()=>{
    getAuthState();
},[])
    const value={
        backendUrl,
        isLoggedin,setIsLoggedin,
        userData,setUserData,
        getUserData,getAuthState

    }
return( 

<AppContext.Provider value={value}>
    {props.children}
</AppContext.Provider>
);
};