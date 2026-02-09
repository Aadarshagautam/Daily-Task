import axios from "axios";
import { createContext, useState, useEffect } from "react";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
    const [isLoggedin, setIsLoggedin] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    axios.defaults.withCredentials = true;


    const getAuthState = async () => {
        try {
          const { data } = await axios.get(
            backendUrl + "/api/auth/is-auth",
            { withCredentials: true }
          );
      
          if (data.success) {
            setIsLoggedin(true);
            await getUserData();
          } else {
            setIsLoggedin(false);
            setUserData(null);
          }
        } catch (error) {
          setIsLoggedin(false);
          setUserData(null);
        } finally {
          setLoading(false);        }
      };
      

    const getUserData = async () => {
      try {
        const { data } = await axios.get(backendUrl + "/api/user/data");

        if (data.success) {
          setUserData(data.user);
          setIsLoggedin(true);
        } else {
          setIsLoggedin(false);
          setUserData(null);
        }
      } catch (error) {
        setIsLoggedin(false);
        setUserData(null);
      }
    }

    

    useEffect(() => {
        getAuthState();
    }, [])

    const value = {
        backendUrl,
        isLoggedin,
        userData,
        setIsLoggedin,
        getUserData,
        setUserData,
        loading,
        
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};