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
    const [utorid, setUtorid] = useState("");
    const [utorid2, setUtorid2] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState("");
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

    async function addUser(e) {
        e.preventDefault();
        const path = `/events/${eventId}/${type}`;
        const headers = { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`};
        const method = 'POST';
        const body = JSON.stringify({utorid});
        
        const res = await ajax(path, { method, headers, body });
        if (res) {
            if (res.ok) {
                setError("");
                fetchEvent();
            }
            else {
                const json = await res.json();
                setError(json.error);
            }
        }
    }

    async function removeUser(e, userId, userType) {
        e.preventDefault();
        const path = `/events/${eventId}/${userType}/${userId}`;
        const headers = { Authorization: `Bearer ${token}`};
        const method = 'DELETE';
        
        const res = await ajax(path, { method, headers });
        if (res) {
            if (res.ok) {
                setError("");
                fetchEvent();
            }
            else {
                const json = await res.json();
                setError(json.error);
            }
        }
    }

    async function award(e) {
        e.preventDefault();
        const path = `/events/${eventId}/transactions`;
        const headers = { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`};
        const method = 'POST';
        const data = {type: "event", amount: parseInt(amount)};
        if (utorid2) {
            data.utorid = utorid2;
        }
        const body = JSON.stringify(data);
        
        const res = await ajax(path, { method, headers, body });
        if (res) {
            const json = await res.json();
            if (res.ok) {
                setError("");
                if (data.utorid) {
                    navigate(`/transactions/${json.id}`, {state: {created: true}});
                }
                else {
                    navigate(`/transactions?type=event&relatedId=${eventId}`, {state: {created: true}});
                }
            }
            else {
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
                <EventDetails event={event} created={created} removeUser={removeUser} />
                {error && <p className="error">{error}</p>}
                <h3>Add User</h3>
                <form className="add" onSubmit={(e) => addUser(e)}>
                <div className="add-container">
                <label htmlFor="utorid">UtorID:</label>
                <input
                    type="text"
                    id="utorid"
                    name="utorid"
                    placeholder='utorid'
                    value={utorid}
                    onChange={(e) => setUtorid(e.target.value)}
                    required
                    />
                <select id="type" name="type" value={type} onChange={(e) => setType(e.target.value)} required>
                    <option value="">-- Select Type --</option>
                    <option value="organizers">Organizer</option>
                    <option value="guests">Guest</option>
                </select>
                <button type="submit">Add</button>
                </div>
                </form>
                <h3>Award Points</h3>
                <form className="add" onSubmit={(e) => award(e)}>
                <div className="add-container">
                <label htmlFor="utorid">UtorID:</label>
                <input
                    type="text"
                    id="utorid"
                    name="utorid"
                    placeholder='utorid'
                    value={utorid2}
                    onChange={(e) => setUtorid2(e.target.value)}
                    />
                <label htmlFor="amount">Amount:</label>
                <input 
                    type='number'
                    name="amount"
                    value={amount}
                    min={1}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                />
                <button type="submit">Award</button>
                </div>
                </form>
                <p className="buttons">
                <button onClick={() => setEdit(true)}>Edit</button>
                <button onClick={() => deleteEvent()}>Delete</button>
                </p>
                </>
            }
            </> 
            
        }
        
    </>;
}