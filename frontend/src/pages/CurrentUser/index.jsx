import React, { useEffect, useState } from "react";
import { useAPI } from "../../contexts/APIContext";
import './styles.css'
import UserProfile from "../../components/UserProfile";
import { useNavigate } from "react-router-dom";
import UpdateCurrentUser from "../../components/UpdateCurrentUser";
import ChangePassword from "../../components/ChangePassword";

export default function CurrentUser({userId}) {
    const { ajax } = useAPI();
    const [edit, setEdit] = useState(false);
    const [changePassword, setChangePassword] = useState(false);
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
    }, [token]); 

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
                    <UserProfile user={user} />
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