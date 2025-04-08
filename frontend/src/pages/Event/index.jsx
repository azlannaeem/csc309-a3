import React, { useEffect, useState } from "react";
import { useAPI } from "../../contexts/APIContext";
import './styles.css'
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import UpdateEvent from "../../components/UpdateEvent";
import EventDetails from "../../components/EventDetails";

export default function Event({eventId}) {
    const { ajax } = useAPI();
    const [event, setEvent] = useState(null);
    const [error, setError] = useState("");
    const [edit, setEdit] = useState(false);
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const clearance = ["superuser", "manager"];
    const { user } = useAuth();
    const location = useLocation();
    const {created} = location.state || {};

    useEffect(() => {
        if (!token || (user && !clearance.includes(user.role))) {
            navigate("/login");
        }
    }, [token, user]); 

    async function fetchEvent() {
        const path = `/events/${eventId}`;
        const headers = { Authorization: `Bearer ${token}`};
        
        const res = await ajax(path, { headers });
        if (res) {
            if (res.ok) {
                const json = await res.json();
                setError("");
                setEvent(json);
                return;
            }
            if (res.status === 404) {
                navigate("/not-found");
            }
        }
    }
    useEffect(() => {
        fetchEvent();
    }, [edit, eventId]);

    async function deleteEvent() {
        const path = `/events/${eventId}`;
        const headers = { Authorization: `Bearer ${token}`};
        const method = 'DELETE';
        
        const res = await ajax(path, { method, headers });
        if (res) {
            if (res.ok) {
                setError("");
                navigate("/success", {state: {deleted: true, item: "Event"}});
            }
            else {
                const json = await res.json();
                setError(json.error);
            }
        }
    }


    return <>
        {edit ? 
            <>
            {event && 
            <UpdateEvent event={event} setEdit={setEdit} />
            }
            </> :
            <>
            {event && 
                <>
                <EventDetails event={event} created={created}/>
                <div>
                {error && <p className="error">{error}</p>}
                <p className="buttons">
                <button onClick={() => setEdit(true)}>Edit</button>
                <button onClick={() => deleteEvent()}>Delete</button>
                </p>
                </div>
                </>
            }
            </> 
            
        }
        
    </>;
}