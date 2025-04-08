import React, { useEffect, useState } from "react";
import { useAPI } from "../../contexts/APIContext";
import './styles.css'
import UserProfile from "../../components/UserProfile";
import UpdateUser from "../../components/UpdateUser";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function User({userId}) {
    const { ajax } = useAPI();
    const [targetUser, setTargetUser] = useState(null);
    const [edit, setEdit] = useState(false);
    const [disabled, setDisabled] = useState(false);
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const clearance = ["superuser", "manager"];
    const { user } = useAuth();

    useEffect(() => {
        if (!token || (user && !clearance.includes(user.role))) {
            navigate("/login");
        }
    }, [token, user]); 

    async function fetchUser() {
        const path = `/users/${userId}`;
        const headers = { Authorization: `Bearer ${token}`};
        
        const res = await ajax(path, { headers });
        if (res) {
            if (res.ok) {
                const json = await res.json();
                setTargetUser(json);
                return;
            }
            if (res.status === 404) {
                navigate("/not-found");
            }
        }
        
        
    }
    useEffect(() => {
        fetchUser();
    }, [edit, userId]);

    useEffect(() => {
        if (user && targetUser) {
            if (clearance.indexOf(user.role) > clearance.indexOf(targetUser.role)) {
                setDisabled(true);
            }
            else {
                setDisabled(false);
            }
        }
    }, [user, targetUser]);

    return <>
        {edit ? 
            <>
            {targetUser && 
            <>
            <UpdateUser user={targetUser} setEdit={setEdit} isSuper={user.role === "superuser"} />
            </>
            }
            </> :
            <>
            {targetUser && 
                <>
                <UserProfile user={targetUser} />
                {!disabled && <button onClick={() => setEdit(true)}>Edit</button>}
                </>
            }
            </> 
            
        }
        
    </>;
}