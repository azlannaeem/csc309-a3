import React, { createContext, useContext, useEffect, useState } from 'react';
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
    const profilePath = '/users/me';
    const loginPath = '/auth/tokens';
    const registerPath = '/users';

    async function fetchUser() {
        const token = localStorage.getItem('token');
        if (token) {
            const expiresAt = new Date(localStorage.getItem('expiresAt'));
            const now = new Date();
            if (now >= expiresAt) {
                localStorage.removeItem('token');
                localStorage.removeItem('expiresAt');
                setUser(null);
                navigate('/login');
            } else {
                const headers = { Authorization: `Bearer ${token}` };

                const res = await ajax(profilePath, { headers });
                if (res.ok) {
                    const json = await res.json();
                    setUser(json);
                }
            }
        }
    }

    useEffect(() => {
        fetchUser();
    }, []);

    /*
     * Logout the currently authenticated user.
     *
     * @remarks This function will always navigate to "/".
     */
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('expiresAt');
        setUser(null);
        navigate('/');
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
        // 🧪 Check content type and log raw response
        const contentType = res?.headers?.get('Content-Type');
        console.log('Content-Type:', contentType);

        const rawText = await res.text(); // Read raw response
        console.log('Raw response:', rawText);

        // Try parsing if JSON
        let json;
        try {
            json = JSON.parse(rawText);
        } catch (err) {
            console.error('❌ Failed to parse JSON:', err);
            return 'Backend did not return valid JSON';
        }
    };

    /**
     * Registers a new user.
     *
     * @remarks Upon success, navigates to "/".
     * @param {Object} userData - The data of the user to register.
     * @returns {string} - Upon failure, returns an error message.
     */
    const register = async (userData) => {
        const token = localStorage.getItem('token');
        const res = await ajax(registerPath, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(userData),
        });
        const json = await res.json();
        if (res.ok) {
            navigate('/success', {
                state: {
                    resetToken: json.resetToken,
                    expiresAt: json.expiresAt,
                    register: true,
                },
            });
        } else {
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
