import React, { createContext, useContext, useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAPI } from './APIContext';

const AuthContext = createContext(null);

/*
 * This provider should export a `user` context state that is 
 * set (to non-null) when:
 *     1. a hard reload happens while a user is logged in.
 *     2. the user just logged in.
 * `user` should be set to null when:
 *     1. a hard reload happens when no users are logged in.
 *     2. the user just logged out.
 */
export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const { ajax } = useAPI();
    const profilePath = "/users/me";
    const loginPath = "/auth/tokens";
    const registerPath = "/users";

    useEffect( () => {
        async function fetchUser() {
            const token = localStorage.getItem("token");
            if (token) {
                const headers = { Authorization: `Bearer ${token}`};
                
                const res = await ajax(profilePath, { headers });
                if (res.ok) {
                    const json = await res.json();
                    setUser(json);
                }
            }
        }
        fetchUser();
    }, []);

    /*
     * Logout the currently authenticated user.
     *
     * @remarks This function will always navigate to "/".
     */
    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
        navigate("/");
    };

    /**
     * Login a user with their credentials.
     *
     * @remarks Upon success, navigates to "/profile". 
     * @param {string} utorid - The utorid of the user.
     * @param {string} password - The password of the user.
     * @returns {string} - Upon failure, Returns an error message.
     */
    const login = async (utorid, password) => {
        var headers = { 'Content-Type': 'application/json' };
        const body = JSON.stringify({ utorid, password });
        let res = await ajax(loginPath, { method: 'POST', headers, body });
        let json = await res.json();
        if (!res.ok) {
            return json.error;
        }
        const token = json.token;
        headers = { Authorization: `Bearer ${token}` };
        localStorage.setItem("token", token);
        res = await ajax(profilePath, { headers });
        json = await res.json();
        if (!res.ok) {
            return json.error;
        }
        setUser(json);
        navigate(`/${json.role}`);
    };

    /**
     * Registers a new user. 
     * 
     * @remarks Upon success, navigates to "/".
     * @param {Object} userData - The data of the user to register.
     * @returns {string} - Upon failure, returns an error message.
     */
    const register = async (userData) => {
        const token = localStorage.getItem("token");
        const res = await ajax(registerPath, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(userData) 
        });
        if (res.ok) {
            navigate("/success");
        }
        else {
            const json = await res.json();
            return json.error;
        }

    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
