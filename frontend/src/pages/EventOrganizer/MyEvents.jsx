import { useEffect, useState } from 'react';
import { useAPI } from '../../contexts/APIContext';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './myevents.css';

export default function MyEvents() {
    const { ajax } = useAPI();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const token = localStorage.getItem('token');
    const take = 1000;
    const skip = 0;

    useEffect(() => {
        const fetchEvents = async () => {
            if (!user) return;
            const res = await ajax(`/events?page=1&limit=1000`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
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
        <div className="events-container">
            <h1>My Events</h1>
            <div className="event-grid">
                {events.map((event) => (
                    <div key={event.id} className="event-card">
                        <h2>{event.name}</h2>
                        <p className="event-location">{event.location}</p>
                        <p className="event-time">
                            {new Date(event.startTime).toLocaleString()} –{' '}
                            {new Date(event.endTime).toLocaleString()}
                        </p>
                        <div className="event-buttons">
                            <button
                                onClick={() =>
                                    navigate(`/events/${event.id}/edit`)
                                }
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
                    </div>
                ))}
            </div>
        </div>
    );
}
