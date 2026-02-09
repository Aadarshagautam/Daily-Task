import axios from "axios";
import { createContext, useState, useEffect } from "react";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
    const [isLoggedin, setIsLoggedinState] = useState(() => {
        return localStorage.getItem("isLoggedin") === "true";
    });
    const [userData, setUserData] = useState(null);
    const [currentOrgId, setCurrentOrgId] = useState(null);
    const [currentOrgName, setCurrentOrgName] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

    axios.defaults.withCredentials = true;


    const setIsLoggedin = (value) => {
        setIsLoggedinState(value);
        localStorage.setItem("isLoggedin", value ? "true" : "false");
    };

    const getAuthState = async () => {
        try {
          const { data } = await axios.get(
            backendUrl + "/api/auth/is-auth",
            { withCredentials: true }
          );
      
          if (data.success) {
            setIsLoggedin(true);
            setCurrentOrgId(data.user?.orgId || null);
            setCurrentOrgName(data.user?.orgName || null);
            await getUserData();
          } else {
            setIsLoggedin(false);
            setUserData(null);
            setCurrentOrgId(null);
            setCurrentOrgName(null);
          }
        } catch (error) {
          if (error.response?.status === 401) {
            setIsLoggedin(false);
            setUserData(null);
            setCurrentOrgId(null);
            setCurrentOrgName(null);
          }
        } finally {
          setHasCheckedAuth(true);
          setLoading(false);
        }
      };
      

    const getUserData = async () => {
      try {
        const { data } = await axios.get(backendUrl + "/api/user/data");

        if (data.success) {
          setUserData(data.user);
          setIsLoggedin(true);
          setCurrentOrgId(data.user?.orgId || null);
          setCurrentOrgName(data.user?.orgName || null);
        } else {
          setIsLoggedin(false);
          setUserData(null);
          setCurrentOrgId(null);
          setCurrentOrgName(null);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          setIsLoggedin(false);
          setUserData(null);
          setCurrentOrgId(null);
          setCurrentOrgName(null);
        }
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
        currentOrgId,
        setCurrentOrgId,
        currentOrgName,
        setCurrentOrgName,
        loading,
        hasCheckedAuth,
        
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};
