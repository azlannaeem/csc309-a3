import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './main.css';
import { Link } from 'react-router';
import { useNavigate } from 'react-router-dom';

function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const clearance = ['superuser', 'manager', 'cashier'];

    useEffect(() => {
        if (!token || (user && !clearance.includes(user.role))) {
            navigate('/login');
        }
    }, [token, user]);

    return (
        <>
            <h3>Hello, {user?.name}!</h3>
            <div className="row">
                <Link to="/users/me">View Profile</Link>
                <Link to="/register">Register</Link>
                <Link to="/create-transaction">Create Transaction</Link>
                <Link to="/process-redemption">Process Redemption</Link>
                <Link onClick={logout}>Logout</Link>
            </div>
            <div className="row">
                {user?.isOrganizer && <Link to="/events">My Events</Link>}
            </div>
        </>
    );
}

export default Profile;
