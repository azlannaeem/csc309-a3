import { useEffect, useState } from "react";
import { useAPI } from "../contexts/APIContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function CreateEvent() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const clearance = ["superuser", "manager"];
    const {user} = useAuth();

    useEffect(() => {
        if (!token || (user && !clearance.includes(user.role))) {
            navigate("/login");
        }
    }, [token, user]); 
    const [data, setData] = useState({
        name: '',
        description: '',
        location: '',
        startTime: '',
        endTime: '',
        capacity: '',
        points: ''
    });
    const [error, setError] = useState("");
    const {ajax} = useAPI();

    const handle_change = (e) => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
    };

    const handle_submit = async (e) => {
        e.preventDefault();
        const finalData = {...data};
        finalData.startTime = new Date(data.startTime);
        finalData.endTime = new Date(data.endTime);
        if (data.capacity) {
            finalData.capacity = parseInt(data.capacity);
        }
        else {
            delete finalData.capacity;
        }
        finalData.points = parseInt(data.points);
        
        const path = "/events";
        const method = 'POST';
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        };
        const body = JSON.stringify(finalData); 
        const resp = await ajax(path, {method, headers, body});
        if (resp) {
            const json = await resp.json();
            if (resp.ok) {
                setError("");
                navigate(`/events/${json.id}`, {state: {created: true}});
            }
            else {
                setError(json.error);
            }
        }
    };

    return <>
        <h2>Create Event</h2>
        <form onSubmit={handle_submit}>
            <label htmlFor="name">Name:</label>
            <input
                type="text"
                name="name"
                placeholder='Name'
                value={data.name}
                onChange={(e) => handle_change(e)}
                required
            />
            <label htmlFor="description">Description:</label>
            <textarea
                name="description"
                rows={4}
                value={data.description}
                onChange={(e) => handle_change(e)}
                required
            />
            <label htmlFor="type">Location</label>
            <input
                type="text"
                name="location"
                placeholder='Location'
                value={data.location}
                onChange={(e) => handle_change(e)}
                required
            />
            <label htmlFor="startTime">Start Time:</label>
            <input 
                type="datetime-local" 
                id="startTime" 
                name="startTime" 
                value={data.startTime}
                onChange={(e) => handle_change(e)}
                required
            /> 
            <label htmlFor="endTime">End Time:</label>
            <input 
                type="datetime-local" 
                id="endTime" 
                name="endTime" 
                value={data.endTime}
                onChange={(e) => handle_change(e)}
                required
            /> 
            <label htmlFor="capacity">Capacity</label>
            <input 
                type='number'
                name="capacity"
                value={data.capacity}
                min={1} 
                onChange={(e) => handle_change(e)}
            />
            <label htmlFor="points">Points:</label>
            <input 
                type='number'
                name="points"
                value={data.points}
                min={1} 
                onChange={(e) => handle_change(e)}
                required
            />
            <div className="btn-container">
                <button type="submit">Create</button>
            </div>
            <p className="error">{error}</p>
        </form>
        </>
}