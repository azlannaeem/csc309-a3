import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAPI } from "../../contexts/APIContext";
import { useAuth } from "../../contexts/AuthContext";

export default function PublishedEvents() {
    const [events, setEvents] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [rsvpMessage, setRsvpMessage] = useState("");
    const [page, setPage] = useState(1); 
    const [totalPages, setTotalPages] = useState(0); 
    const { ajax } = useAPI();
    const navigate = useNavigate();
    const { user } = useAuth();
    const token = localStorage.getItem("token");
    const [limit, setLimit] = useState(2);

    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
    }, [token, user]);

    const fetchPublishedEvents = async () => {
        if (!user) return;

        setLoading(true);
        try {
            let res;

            if (user.role === "regular" || user.role === "cashier") {
                res = await ajax(`/events?page=${page}&limit=${limit}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                res = await ajax(`/events?published=true&page=${page}&limit=${limit}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            if (res.ok) {
                const data = await res.json();
                setEvents(data.results || []);
                setTotalPages(Math.ceil(data.count / limit)); 
                setError("");
            } else {
                const errorData = await res.json();
                setError(errorData.error || "Failed to fetch events.");
            }
        } catch (err) {
            setError("An error occurred while fetching events.");
        } finally {
            setLoading(false);
        }
    };

    const handleRSVP = async (eventId) => {
        try {
            const res = await ajax(`/events/${eventId}/guests/me`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setRsvpMessage(`Successfully RSVP'd to event ${eventId}!`);
                fetchPublishedEvents();
            } else {
                const errorData = await res.json();
                setRsvpMessage(`Error: ${errorData.error}`);
            }
        } catch (err) {
            setRsvpMessage("An error occurred while trying to RSVP.");
        }
    };

    useEffect(() => {
        fetchPublishedEvents();
    }, [user, page, limit]);    

    return (
        <div>
            <h1>Published Events</h1>
            {error && <p className="error">{error}</p>}
            {rsvpMessage && <p className="message">{rsvpMessage}</p>}
            {loading ? (
                <p>Loading events...</p>
            ) : events.length > 0 ? (
                <>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Location</th>
                                <th>Start Time</th>
                                <th>End Time</th>
                                <th>Capacity</th>
                                <th>Number of Guests</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((event) => (
                                <tr key={event.id}>
                                    <td>{event.name}</td>
                                    <td>{event.location}</td>
                                    <td>{new Date(event.startTime).toLocaleString()}</td>
                                    <td>{new Date(event.endTime).toLocaleString()}</td>
                                    <td>{event.capacity || "N/A"}</td>
                                    <td>{event.numGuests}</td>
                                    <td>
                                        <button onClick={() => handleRSVP(event.id)}>RSVP</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem", gap: "1rem" }}>
                        <label htmlFor="limitSelect">Events per page:</label>
                        <select
                            id="limitSelect"
                            value={limit}
                            onChange={(e) => {
                                setPage(1);
                                setLimit(Number(e.target.value));
                            }}
                        >
                            {[2, 5, 10, 20].map((num) => (
                                <option key={num} value={num}>
                                    {num}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div
                        className="pagination"
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "1rem", 
                            marginTop: "1.5rem",
                        }}
                    >
                        <button
                            disabled={page === 1}
                            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        >
                            Previous
                        </button>
                        <span style={{ minWidth: "120px", textAlign: "center" }}>
                            Page {page} of {totalPages}
                        </span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                        >
                            Next
                        </button>
                    </div>
                </>
            ) : (
                <p>No published events available.</p>
            )}
        </div>
    );
}