import { useAuth } from "../contexts/AuthContext";
import "./main.css";
import { Link } from "react-router";

function Profile() {
    const { user, logout } = useAuth();
    const date = new Date(user?.createdAt);
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    const pretty_date = date.toLocaleTimeString('en-US', options);

    return <>
        <h3>Hello, {user?.name}!</h3>
        <div className="row">
            <Link to="/register">Register</Link>
            <Link to="/users">Users</Link>
            <a href="#" onClick={logout}>Logout</a>
        </div>
    </>;
}

export default Profile;