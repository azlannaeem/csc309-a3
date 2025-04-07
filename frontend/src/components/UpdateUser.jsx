import { useState } from "react";
import { useAPI } from "../contexts/APIContext";

export default function UpdateUser({user, setEdit, isSuper}) {
    const [email, setEmail] = useState(user.email);
    const [role, setRole] = useState(user.role);
    const [verified, setVerified] = useState(null);
    const [suspicious, setSuspicious] = useState(null);
    const [error, setError] = useState("");
    const {ajax, fetching} = useAPI();
    const handle_submit = async (e) => {
        e.preventDefault();
        const updatedUser = {};
        if (email !== user.email) {
            updatedUser.email = email;
        }
        if (role !== user.role) {
            updatedUser.role = role;
        }
        if (verified !== null) {
            updatedUser.verified = verified;
        }
        if (suspicious !== null) {
            updatedUser.suspicious = suspicious;
        }
        if (Object.keys(updatedUser).length < 1) {
            setError("No changes were made");
            return;
        }
        const path = `/users/${user.id}`;
        const method = 'PATCH';
        const token = localStorage.getItem("token");
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        };
        const body = JSON.stringify(updatedUser); 
        const resp = await ajax(path, {method, headers, body});
        if (resp) {
            if (resp.ok) {
                setError("");
                setEdit(false);
            }
            else {
                const json = await resp.json();
                setError(json.error);
            }
        }
    };

    return <>
        <h2>Edit User</h2>
        <form className="update" onSubmit={handle_submit}>
            <label htmlFor="email">Email:</label>
            <input
                type="text"
                name="email"
                placeholder='Email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <label htmlFor="role">Role</label>
            <select id="role" name="role" defaultValue={role} onChange={(e) => setRole(e.target.value)} required>
                <option value="regular">Regular</option>
                <option value="cashier">Cashier</option>
                <>
                {isSuper && <>
                <option value="manager">Manager</option>
                <option value="superuser">Super User</option>
                </>
                }
                </>
            </select>
            {!user.verified && <>
                <label htmlFor="verified">Mark as Verified</label>
                <input
                    type="checkbox"
                    id="verified"
                    name="verified"
                    onChange={(e) => {
                    if (e.target.checked) {
                        setVerified(true);
                    }
                    else {
                        setVerified(null);
                    }
                    }}
                /> 
                </>
            }
            {user.suspicious ? <>
                <label htmlFor="unsuspicious">Mark as Unsuspicious</label>
                <input
                    type="checkbox"
                    id="unsuspicious"
                    name="unsuspicious"
                    onChange={(e) => {
                    if (e.target.checked) {
                        setSuspicious(false);
                    }
                    else {
                        setSuspicious(null);
                    }
                    }}
                /> 
                </> :
                <>
                <label htmlFor="suspicious">Mark as Suspicious</label>
                <input
                    type="checkbox"
                    id="suspicious"
                    name="suspicious"
                    onChange={(e) => {
                    if (e.target.checked) {
                        setSuspicious(true);
                    }
                    else {
                        setSuspicious(null);
                    }
                    }}
                /> 
                </>
            }
            <p className="buttons">
            <button onClick={() => setEdit(false)}>Cancel</button>
            <button type="submit" disabled={fetching}>Update</button>
            </p>   
            <p className="error">{error}</p>
        </form>
        </>
}