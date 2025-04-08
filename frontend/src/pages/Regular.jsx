import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './main.css';
import { Link, useNavigate } from 'react-router-dom';

function Profile() {
    const { user, logout } = useAuth();
    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            navigate('/login');
        }
    }, [token]);

    return (
        <>
            <h3>Hello, {user?.name}!</h3>
            <div className="row">
                <Link to="/users/me">View Profile</Link>
                <Link onClick={logout}>Logout</Link>
                {user?.isOrganizer && user?.organizerEvents?.length > 0 && (
                    <>
                        <h4>Your Events:</h4>
                        {user.organizerEvents.map((event) => (
                            <div key={event.id} className="event-links">
                                <p>
                                    <strong>{event.name}</strong>
                                </p>
                                <Link to={`/myevents`}>View All</Link>
                                <Link to={`/editevent/${event.id}`}>Edit</Link>
                                <Link to={`/addguests/${event.id}`}>
                                    Add Guests
                                </Link>
                                <Link to={`/awardpoints/${event.id}`}>
                                    Award Points
                                </Link>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </>
    );
}

export default Profile;
