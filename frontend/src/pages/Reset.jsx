import { useNavigate } from 'react-router-dom';
import './form.css';
import React, { useState } from "react";
import { useAPI } from '../contexts/APIContext';

export default function Reset() {
    const [utorid, setUtorid] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { ajax, fetching } = useAPI();

    const handle_submit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Confirm password does not match New Password");
            return;
        }
        const path = `/auth/resets/${resetToken}`;
        const method = 'POST';
        const headers = {'Content-Type': 'application/json'};
        const body = JSON.stringify({utorid, password}); 
        const resp = await ajax(path, {method, headers, body});
        if (resp) {
            if (resp.ok) {
                navigate("/login");
                setError("");
            }
            else {
                const json = await resp.json();
                setError(json.error);
            }
        }
    };

    return <>
        <h2>Reset Password</h2>
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
            <label htmlFor="password">New Password:</label>
            <input
                type="password"
                name="password"
                placeholder='New Password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <label htmlFor="confirm">Confirm New Password:</label>
            <input
                type="password"
                name="confirm"
                placeholder='Confirm New Password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
            />
            <label htmlFor="token">Reset Token:</label>
            <input
                type="password"
                name="token"
                placeholder='Reset Token'
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                required
            />
            <div className='btn-container'>
                <button type="submit" disabled={fetching}>Reset</button>
            </div>
                
            <p className="error">{error}</p>
        </form>
    </>;
}