import { useState } from "react";
import { useAPI } from "../contexts/APIContext";

export default function ChangePassword({setChangePassword}) {
    const [old, setOld] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const { ajax, fetching } = useAPI();
    const token = localStorage.getItem("token");

    const handle_submit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Confirm password does not match New Password");
            return;
        }
        const path = "/users/me/password";
        const method = 'PATCH';
        const headers = {'Content-Type': 'application/json', Authorization: `Bearer ${token}`};
        const body = JSON.stringify({old, new: password}); 
        const resp = await ajax(path, {method, headers, body});
        if (resp) {
            if (resp.ok) {
                setError("");
                setChangePassword(false);
            }
            else {
                const json = await resp.json();
                setError(json.error);
            }
        }
    };

    return <>
        <h2>Change Password</h2>
        <form className="update" onSubmit={handle_submit}>
        <label htmlFor="old">Old Password:</label>
            <input
                type="password"
                name="old"
                placeholder='Old Password'
                value={old}
                onChange={(e) => setOld(e.target.value)}
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
            <p className="buttons">
            <button onClick={() => setChangePassword(false)}>Cancel</button>
            <button type="submit" disabled={fetching}>Update</button>
            </p>   
            <p className="error">{error}</p>
        </form>
    </>
}
