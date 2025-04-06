import React, { useEffect, useState } from "react";
import { useAPI } from "../../contexts/APIContext";
import './styles.css'
import UserProfile from "./UserProfile";
import Update from "./Update";

export default function User({userId}) {
    const { ajax } = useAPI();
    const [user, setUser] = useState(null);
    const [edit, setEdit] = useState(false);
    async function fetchUser() {
        const token = localStorage.getItem("token");
        const path = `/users/${userId}`;
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
            <Update user={user} setEdit={setEdit} />
            </>
            }
            </> :
            <>
            {user && 
                <>
                <UserProfile user={user} />
                <button onClick={() => setEdit(true)}>Edit</button>
                </>
            }
            </> 
            
        }
        
    </>;
}