import { useAuth } from '../contexts/AuthContext';
import './main.css';
import { Link } from 'react-router';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Profile() {
    const { user, logout } = useAuth();
    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    useEffect(() => {
        if (!token || (user && user.role !== 'superuser')) {
            navigate('/login');
        }
    }, [token, user]);

    return (
        <>
            <h3>Hello, {user?.name}!</h3>
            <div className="row">
                <Link to="/users/me">View Profile</Link>
                <Link to="/register">Register</Link>
                <Link to="/users">Users</Link>
            </div>
            <div className="row">
                <Link to="/transactions">Transactions</Link>
                <Link to="/promotions">Promotions</Link>
                <Link to="/promotion">Create Promotion</Link>
            </div>
            <div className="row">
                {user?.isOrganizer && <Link to="/myevents">My Events</Link>}
                <Link to="/events">Events</Link>
                <Link to="/event">Create Event</Link>
            </div>
            <div className='row'>
                <Link onClick={logout}>Logout</Link>
            </div>
        </>
    );
}

export default Profile;
