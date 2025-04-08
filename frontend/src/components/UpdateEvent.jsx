import { useState } from "react";
import { useAPI } from "../contexts/APIContext";

export default function UpdateEvent({event, setEdit}) {
    function convertToLocalTimeString(isoString) {
        const date = new Date(isoString); 
    
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); 
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
    
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    const [name, setName] = useState(event.name);
    const [description, setDescription] = useState(event.description);
    const [location, setLocation] = useState(event.location);
    const [startTime, setStartTime] = useState(convertToLocalTimeString(event.startTime));
    const [endTime, setEndTime] = useState(convertToLocalTimeString(event.endTime));
    const [capacity, setCapacity] = useState(event.capacity ? `${event.capacity}` : "");
    const [unlimited, setUnlimited] = useState(event.capacity === null);
    const [points, setPoints] = useState(`${event.pointsRemain + event.pointsAwarded}`);
    const [published, setPublished] = useState(false);

    const [error, setError] = useState("");
    const {ajax, fetching} = useAPI();
    const handle_submit = async (e) => {
        e.preventDefault();
        const updatedEvent = {};
        if (name !== event.name) {
            updatedEvent.name = name;
        }
        if (description !== event.description) {
            updatedEvent.description = description;
        }
        if (location !== event.location) {
            updatedEvent.location = location;
        }
        if (startTime !== convertToLocalTimeString(event.startTime)) {
            updatedEvent.startTime = new Date(startTime);
        }
        if (endTime !== convertToLocalTimeString(event.endTime)) {
            updatedEvent.endTime = new Date(endTime);
        }
        if (capacity && parseInt(capacity) !== event.capacity) {
            updatedEvent.capacity = parseInt(capacity);
        }
        if (unlimited && (event.capacity !== null)) {
            updatedEvent.capacity = null;
        }
        if (points && parseInt(points) !== (event.pointsRemain + event.pointsAwarded)) {
            updatedEvent.points = parseInt(points);
        }
        if (published) {
            updatedEvent.published = published;
        }
        if (Object.keys(updatedEvent).length < 1) {
            setError("No changes were made");
            return;
        }
        const path = `/events/${event.id}`;
        const method = 'PATCH';
        const token = localStorage.getItem("token");
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        };
        const body = JSON.stringify(updatedEvent); 
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
        <h2>Edit Event</h2>
        <form className="update" onSubmit={handle_submit}>
            <label htmlFor="name">Name:</label>
            <input
                type="text"
                name="name"
                placeholder='Name'
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <label htmlFor="description">Description:</label>
            <textarea
                name="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />
            <label htmlFor="location">Location:</label>
            <input
                type="text"
                name="location"
                placeholder='Location'
                value={location}
                onChange={(e) => setLocation(e.target.value)}
            />
            <label htmlFor="startTime">Start Time:</label>
            <input 
                type="datetime-local" 
                id="startTime" 
                name="startTime" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
            /> 
            <label htmlFor="endTime">End Time:</label>
            <input 
                type="datetime-local" 
                id="endTime" 
                name="endTime" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
            /> 
            <label htmlFor="capacity">Capacity:</label>
            <input 
                type='number'
                name="capacity"
                value={capacity}
                min={1} 
                onChange={(e) => {
                    setCapacity(e.target.value);
                    setUnlimited(false);
                }}
            />
            <label htmlFor="unlimited">Unlimited Capacity</label>
            <input 
                type='checkbox'
                name="unlimited"
                onChange={(e) => {
                    if (e.target.checked) {
                        setUnlimited(true);
                        setCapacity("");
                    } else {
                        setUnlimited(false);
                    }
                }}
                checked={unlimited} 
            />
            <label htmlFor="points">Points:</label>
            <input 
                type='number'
                name="points"
                value={points}
                min={0} 
                onChange={(e) => setPoints(e.target.value)}
            />
            {!event.published && <>
            <label htmlFor="published">Publish Event</label>
            <input 
                type='checkbox'
                name="published"
                onChange={(e) => {
                    if (e.target.checked) {
                        setPublished(true);
                    } else {
                        setPublished(false);
                    }
                }}
                checked={published} 
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