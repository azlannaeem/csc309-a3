import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAPI } from '../../contexts/APIContext';

export default function EditEvent() {
    const { eventId } = useParams();
    const { ajax } = useAPI();
    const [event, setEvent] = useState(null);
    const [message, setMessage] = useState('');
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchEvent = async () => {
            const token = localStorage.getItem('token');
            const res = await ajax(`/events/${eventId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.ok) {
                const data = await res.json();
                setEvent(data);
            } else {
                const err = await res.json();
                console.error('Error fetching event:', err.error);
            }
        };
        fetchEvent();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { name, description, location } = event;
        const resp = await ajax(`/events/${eventId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name, description, location }),
        });
        setMessage(resp.ok ? 'Updated!' : 'Error');
    };

    if (!event) return <p>Loading...</p>;

    return (
        <form onSubmit={handleSubmit}>
            <input
                value={event.name}
                onChange={(e) => setEvent({ ...event, name: e.target.value })}
            />
            <input
                value={event.location}
                onChange={(e) =>
                    setEvent({ ...event, location: e.target.value })
                }
            />
            <textarea
                value={event.description}
                onChange={(e) =>
                    setEvent({ ...event, description: e.target.value })
                }
            />
            <button type="submit">Update</button>
            <p>{message}</p>
        </form>
    );
}
