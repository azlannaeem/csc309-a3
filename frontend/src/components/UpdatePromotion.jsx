import { useState } from "react";
import { useAPI } from "../contexts/APIContext";

export default function UpdatePromotion({promotion, setEdit}) {
    function convertToLocalTimeString(isoString) {
        const date = new Date(isoString); 
    
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); 
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
    
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    const [name, setName] = useState(promotion.name);
    const [description, setDescription] = useState(promotion.description);
    const [type, setType] = useState(promotion.type);
    const [startTime, setStartTime] = useState(convertToLocalTimeString(promotion.startTime));
    const [endTime, setEndTime] = useState(convertToLocalTimeString(promotion.endTime));
    const [minSpending, setMinSpending] = useState(promotion.minSpending);
    const [rate, setRate] = useState(promotion.rate);
    const [points, setPoints] = useState(promotion.points);

    const [error, setError] = useState("");
    const {ajax, fetching} = useAPI();
    const handle_submit = async (e) => {
        e.preventDefault();
        const updatedPromotion = {};
        if (name !== promotion.name) {
            updatedPromotion.name = name;
        }
        if (description !== promotion.description) {
            updatedPromotion.description = description;
        }
        if (type !== promotion.type) {
            updatedPromotion.type = type;
        }
        if (startTime !== convertToLocalTimeString(promotion.startTime)) {
            updatedPromotion.startTime = new Date(startTime);
        }
        if (endTime !== convertToLocalTimeString(promotion.endTime)) {
            updatedPromotion.endTime = new Date(endTime);
        }
        if (minSpending !== promotion.minSpending) {
            updatedPromotion.minSpending = parseFloat(minSpending);
        }
        if (rate !== promotion.rate) {
            updatedPromotion.rate = parseFloat(rate);
        }
        if (points !== promotion.points) {
            updatedPromotion.points = parseInt(points);
        }
        if (Object.keys(updatedPromotion).length < 1) {
            setError("No changes were made");
            return;
        }
        const path = `/promotions/${promotion.id}`;
        const method = 'PATCH';
        const token = localStorage.getItem("token");
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        };
        const body = JSON.stringify(updatedPromotion); 
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
        <h2>Edit Promotion</h2>
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
            <label htmlFor="type">Type</label>
            <select id="type" name="type" defaultValue={type} onChange={(e) => setType(e.target.value)}>
                <option value="automatic">Automatic</option>
                <option value="one-time">One Time</option>
            </select>
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
            <label htmlFor="minSpending">Min Spending:</label>
            <input 
                type='number'
                name="minSpending"
                value={minSpending}
                min={0} 
                step={0.01}
                onChange={(e) => setMinSpending(e.target.value)}
            />
            <label htmlFor="rate">Rate:</label>
            <input 
                type='number'
                name="rate"
                value={rate}
                min={0} 
                step={0.01}
                onChange={(e) => setRate(e.target.value)}
            />
            <label htmlFor="points">Points:</label>
            <input 
                type='number'
                name="points"
                value={points}
                min={0} 
                onChange={(e) => setPoints(e.target.value)}
            />
            <p className="buttons">
            <button onClick={() => setEdit(false)}>Cancel</button>
            <button type="submit" disabled={fetching}>Update</button>
            </p>   
            <p className="error">{error}</p>
        </form>
        </>
}