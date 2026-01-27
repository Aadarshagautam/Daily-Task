import axios from "axios";
import { createContext, useState, useEffect } from "react";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    axios.defaults.withCredentials = true;
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [isLoggedin, setIsLoggedin] = useState(false);
    const [userData, setUserData] = useState(null);

    const getAuthState = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/auth/is-auth', { withCredentials: true });
            console.log("Auth response:", data); // Debug log
            if (data.success) {
                setIsLoggedin(true);
                // Set user data directly from auth response if available
                if (data.user) {
                    setUserData(data.user);
                } else {
                    getUserData(); // Fetch user data separately if not in auth response
                }
            }
        } catch (error) {
            // Don't log 401 as an error - it just means user is not logged in
            if (error.response?.status !== 401) {
                console.error("Auth check failed:", error);
            }
            setIsLoggedin(false);
            setUserData(null);
        }
    }

    const getUserData = async () => {
        try {
            console.log("Fetching user data..."); // Debug log
            const { data } = await axios.get(backendUrl + '/api/user/data', { withCredentials: true });
            console.log("User data response:", data); // Debug log
            if (data.success) {
                setUserData(data.user);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Failed to fetch user data:", error);
            console.error("Error response:", error.response?.data); // Debug log
            // Don't show toast if it's just a 401 (not logged in)
            if (error.response?.status !== 401) {
                toast.error("Failed to fetch user data");
            }
        }
    }

    useEffect(() => {
        getAuthState();
    }, [])

    const value = {
        backendUrl,
        isLoggedin,
        setIsLoggedin,
        userData,
        setUserData,
        getUserData,
        getAuthState
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};