import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import "./main.css";
import { Link, useNavigate } from "react-router-dom";

function Profile() {
    const { user, logout } = useAuth();
    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
    }, [token]); 

    return <>
        <h3>Hello, {user?.name}!</h3>
        <div className="row">
            <Link to="/users/me">View Profile</Link>
            <Link onClick={logout}>Logout</Link>
            <Link to="/transfer-points">Transfer Points</Link>
            <Link to="/published-events">View Published Events</Link>  
            <Link to="/my-transactions">View Transactions</Link>
        </div>
    </>;
}

export default Profile;
