import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './form.css';
import React, { useState } from "react";
import { useAPI } from '../contexts/APIContext';

function Login() {
    const [utorid, setUtorid] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();
    const {ajax} = useAPI();

    const handle_submit = (e) => {
        e.preventDefault();
        login(utorid, password)
        .then(message => setError(message));
    };

    const gen_token = async (e) => {
        e.preventDefault();
        if (!utorid) {
            setError("Enter utorid to generate reset token.");
            return;
        }
        const path = "/auth/resets";
        const method = 'POST';
        const headers = {'Content-Type': 'application/json'};
        const body = JSON.stringify({utorid}); 
        const resp = await ajax(path, {method, headers, body});
        if (resp) {
            const json = await resp.json();
            if (resp.ok) {
                navigate("/success", { state: { resetToken: json.resetToken, expiresAt: json.expiresAt, register: false } });
                setError("");
            }
            else {
                setError(json.error);
            }
        }
    };

    return <>
        <h2>Login</h2>
        <form onSubmit={handle_submit}>
            <label htmlFor="utorid">utorid:</label>
            <input
                type="text"
                name="utorid"
                placeholder='utorid'
                value={utorid}
                onChange={(e) => setUtorid(e.target.value)}
                required
            />
            <label htmlFor="password">Password:</label>
            <input
                type="password"
                name="password"
                placeholder='Password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />

            <div className='btn-container'>
                <button type="submit">Login</button>
                <button onClick={(e) => gen_token(e)}>Forgot Password</button>
            </div>
                
            <p className="error">{error}</p>
        </form>
    </>;
}

export default Login;
