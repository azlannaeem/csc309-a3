import React, { useEffect, useState } from "react";
import { useAPI } from "../../contexts/APIContext";
import './styles.css'
import UserProfile from "../../components/UserProfile";
import { useNavigate } from "react-router-dom";
import UpdateCurrentUser from "../../components/UpdateCurrentUser";
import ChangePassword from "../../components/ChangePassword";
import { useAuth } from "../../contexts/AuthContext";

export default function CurrentUser() {
    const { ajax } = useAPI();
    const [edit, setEdit] = useState(false);
    const [changePassword, setChangePassword] = useState(false);
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const [flag, setFlag] = useState(false);
    const [user, setUser] = useState(null);
    const clearance = ["superuser", "manager"];
    const { user: loggedIn } = useAuth();

    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
        if (loggedIn && clearance.includes(loggedIn.role)) {
            setFlag(true);
        }
    }, [token, loggedIn]); 

    async function fetchUser() {
        const path = `/users/me`;
        const headers = { Authorization: `Bearer ${token}`};
        
        const res = await ajax(path, { headers });
        if (res.ok) {
            const json = await res.json();
            setUser(json);
        }
    }
    useEffect(() => {
        fetchUser();
    }, [edit]);

    return <>
        {edit ? 
            <>
            {user && 
            <>
            <UpdateCurrentUser user={user} setEdit={setEdit} />
            </>
            }
            </> :
            <>
            { changePassword ?
                <ChangePassword setChangePassword={setChangePassword}/> :
                <>
                {user && 
                    <>
                    <UserProfile user={user} flag={flag} />
                    <p className="buttons">
                    <button onClick={() => setEdit(true)}>Edit Profile</button>
                    <button onClick={() => setChangePassword(true)}>Change Password</button>
                    </p> 
                    </>
                }
                </> 
            }
            </>
        }
        
    </>;
}