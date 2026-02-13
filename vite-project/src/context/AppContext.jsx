import axios from "axios";
import { createContext, useState, useEffect, useCallback } from "react";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
    const [isLoggedin, setIsLoggedinState] = useState(false);
    const [userData, setUserData] = useState(null);
    const [currentOrgId, setCurrentOrgId] = useState(null);
    const [currentOrgName, setCurrentOrgName] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userPermissions, setUserPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

    axios.defaults.withCredentials = true;


    const setIsLoggedin = (value) => {
        setIsLoggedinState(value);
    };

    const getAuthState = async () => {
        try {
          const { data } = await axios.get(
            backendUrl + "/api/auth/is-auth",
            { withCredentials: true }
          );
      
          if (data.success) {
            setIsLoggedin(true);
            setCurrentOrgId(data.data?.orgId || null);
            setCurrentOrgName(data.data?.orgName || null);
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
          const user = data.data || null;
          setUserData(user);
          setIsLoggedin(true);
          setCurrentOrgId(user?.orgId || null);
          setCurrentOrgName(user?.orgName || null);
          setUserRole(user?.role || null);
          setUserPermissions(user?.permissions || []);
        } else {
          setIsLoggedin(false);
          setUserData(null);
          setCurrentOrgId(null);
          setCurrentOrgName(null);
          setUserRole(null);
          setUserPermissions([]);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          setIsLoggedin(false);
          setUserData(null);
          setCurrentOrgId(null);
          setCurrentOrgName(null);
          setUserRole(null);
          setUserPermissions([]);
        }
      }
    }

    const hasPermission = useCallback((required) => {
      if (!required) return true;
      if (userPermissions.includes("*")) return true;
      if (userPermissions.includes(required)) return true;
      const [module] = required.split(".");
      if (userPermissions.includes(`${module}.*`)) return true;
      return false;
    }, [userPermissions]);

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
        userRole,
        userPermissions,
        hasPermission,
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};
