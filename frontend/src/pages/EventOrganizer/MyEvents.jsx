import { useEffect, useState } from 'react';
import { useAPI } from '../../contexts/APIContext';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function MyEvents() {
    const { ajax } = useAPI();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchEvents = async () => {
            if (!user) return;
            const res = await ajax('/events', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.ok) {
                const data = await res.json();
                const events = data.results || [];

                const organizedEvents = events.filter(
                    (e) =>
                        Array.isArray(e.organizers) &&
                        e.organizers?.some((o) => o && o.utorid === user.utorid)
                );
                setEvents(organizedEvents);
            } else {
                const err = await res.json();
                console.error('Error fetching events:', err.error);
            }
        };
        fetchEvents();
    }, []);

    return (
        <div>
            <h2>My Events</h2>
            {events.map((event) => (
                <div key={event.id} className="event-card">
                    <h3>{event.name}</h3>
                    <p>{event.location}</p>
                    <p>
                        {new Date(event.startTime).toLocaleString()} -{' '}
                        {new Date(event.endTime).toLocaleString()}
                    </p>

                    <button
                        onClick={() => navigate(`/events/${event.id}/edit`)}
                    >
                        Edit
                    </button>
                    <button
                        onClick={() =>
                            navigate(`/events/${event.id}/add-guests`)
                        }
                    >
                        Add Guests
                    </button>
                    <button
                        onClick={() =>
                            navigate(`/events/${event.id}/award-points`)
                        }
                    >
                        Award Points
                    </button>
                </div>
            ))}
        </div>
    );
}
