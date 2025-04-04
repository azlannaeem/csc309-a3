import React, { createContext, useContext, useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

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
    const profileUrl = `${BACKEND_URL}/users/me`;
    const loginUrl = `${BACKEND_URL}/auth/tokens`;
    const registerUrl = `${BACKEND_URL}/users`;

    useEffect( () => {
        async function fetchUser() {
            const token = localStorage.getItem("token");
            if (token) {
                
                const res = await fetch(profileUrl, {
                    headers: {Authorization: `Bearer ${token}`}
                });
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
        let res = await fetch(loginUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ utorid, password })
        });
        let json = await res.json();
        if (!res.ok) {
            return json.error;
        }
        const token = json.token;
        localStorage.setItem("token", token);
        res = await fetch(profileUrl, {
            headers: {Authorization: `Bearer ${token}`}
        });
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
        const res = await fetch(registerUrl, {
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
