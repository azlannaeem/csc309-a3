import { useNavigate } from "react-router-dom";

export default function Table({events}) {
    const formatDate = (date) => {
        if (!date) return "N/A";
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true               
        };
        return new Date(date).toLocaleDateString(undefined, options);
    };
    const navigate = useNavigate();
    return (
        <div className="table-container">
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Capacity</th>
                    <th>Points Remain</th>
                    <th>Points Awarded</th>
                    <th>Published</th>
                    <th>Num Guests</th>
                </tr>
            </thead>
            <tbody>
                {events.map(e => (
                    <tr key={e.id} className="clickable" onClick={() => navigate(`/events/${e.id}`)}>
                        <td>{e.name}</td>
                        <td>{e.location}</td>
                        <td>{formatDate(e.startTime)}</td>
                        <td>{formatDate(e.endTime)}</td>
                        <td>{e.capacity || "N/A"}</td>
                        <td>{e.pointsRemain}</td>
                        <td>{e.pointsAwarded}</td>
                        <td>{e.published ? "Yes" : "No"}</td>
                        <td>{e.numGuests}</td>
                    </tr>
                ))}
            </tbody>
        </table>
        </div>
    );
}