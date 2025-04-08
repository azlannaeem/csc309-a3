import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAPI } from '../../contexts/APIContext';

export default function AddUsers() {
    const { eventId } = useParams();
    const { ajax } = useAPI();
    const [utorid, setUtorid] = useState('');
    const [message, setMessage] = useState('');
    const token = localStorage.getItem('token');

    const handleAdd = async (e) => {
        e.preventDefault();
        const resp = await ajax(`/events/${eventId}/guests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ utorid }),
        });
        const json = await resp.json();
        setMessage(
            resp.ok ? `Added ${json.guestAdded.name}` : `Error: ${json.error}`
        );
    };

    return (
        <form onSubmit={handleAdd}>
            <label>UTORid:</label>
            <input
                value={utorid}
                onChange={(e) => setUtorid(e.target.value)}
                required
            />
            <button type="submit">Add User</button>
            <p>{message}</p>
        </form>
    );
}
