import { useEffect, useState } from "react";
import { useAPI } from "../contexts/APIContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function CreatePromotion() {
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
        type: '',
        startTime: '',
        endTime: '',
        minSpending: '',
        rate: '',
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
        if (data.minSpending) {
            finalData.minSpending = parseFloat(data.minSpending);
        }
        else {
            delete finalData.minSpending;
        }
        if (data.rate) {
            finalData.rate = parseFloat(data.rate);
        }
        else {
            delete finalData.rate;
        }
        if (data.points) {
            finalData.points = parseInt(data.points);
        }
        else {
            delete finalData.points;
        }
        
        const path = "/promotions";
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
                navigate(`/promotions/${json.id}`, {state: {created: true}});
            }
            else {
                setError(json.error);
            }
        }
    };

    return <>
        <h2>Create Promotion</h2>
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
            <label htmlFor="type">Type</label>
            <select id="type" name="type" value={data.type} onChange={(e) => handle_change(e)} required>
                <option value="">-- Select Type --</option>
                <option value="automatic">Automatic</option>
                <option value="one-time">One Time</option>
            </select>
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
            <label htmlFor="minSpending">Min Spending:</label>
            <input 
                type='number'
                name="minSpending"
                value={data.minSpending}
                min={0} 
                step={0.01}
                onChange={(e) => handle_change(e)}
            />
            <label htmlFor="rate">Rate:</label>
            <input 
                type='number'
                name="rate"
                value={data.rate}
                min={0} 
                step={0.01}
                onChange={(e) => handle_change(e)}
            />
            <label htmlFor="points">Points:</label>
            <input 
                type='number'
                name="points"
                value={data.points}
                min={0} 
                onChange={(e) => handle_change(e)}
            />
            <div className="btn-container">
                <button type="submit">Create</button>
            </div>
            <p className="error">{error}</p>
        </form>
        </>
}