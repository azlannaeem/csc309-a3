import { useNavigate } from "react-router-dom";

export default function EventDetails ({ event, created }) {
  const navigate = useNavigate();
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
  
    return (
        <>
        {created? <h2>Event Created</h2> : <h2>Event Details</h2>}
        <div className="user-info">
          <p><strong>Name:</strong> {event.name}</p>
          <p><strong>Description:</strong> {event.description}</p>
          <p><strong>Location:</strong> {event.type}</p>
          <p><strong>Start Time:</strong> {formatDate(event.startTime)}</p>
          <p><strong>End Time:</strong> {formatDate(event.endTime)}</p>
          <p><strong>Capacity:</strong> {event.capacity || "Unlimited"}</p>
          <p><strong>Points Remain:</strong> {event.pointsRemain}</p>
          <p><strong>Points Awarded:</strong> {event.pointsAwarded}</p>
          <p><strong>Published:</strong> {event.published ? "Yes" : "No"}</p>
          <p><strong>Points Awarded:</strong> {event.pointsAwarded}</p>
          </div>

          <div className="promotions">
          <h3>Organizers</h3>
          {event.organizers.length > 0 ? (
            <ul>
              {event.organizers.map((organizer) => (
                <li className="clickable" key={organizer.id} onClick={() => navigate(`/users/${organizer.id}`)}>
                  <p><strong>UtorID:</strong> {organizer.utorid}</p>
                  <p><strong>Name:</strong> {organizer.name}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>None</p>
          )}
        </div>
        
        <div className="promotions">
          <h3>Guests</h3>
          {event.guests.length > 0 ? (
            <ul>
              {event.guests.map((guest) => (
                <li className="clickable" key={guest.id} onClick={() => navigate(`/users/${guest.id}`)}>
                  <p><strong>UtorID:</strong> {guest.utorid}</p>
                  <p><strong>Name:</strong> {guest.name}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>None</p>
          )}
        </div>
      </>
    );
  };