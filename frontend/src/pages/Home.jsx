import "./main.css";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Home() {
    const { user } = useAuth();
    const clearance = {
        superuser: ["manager", "cashier", "regular"], 
        manager: ["cashier", "regular"], 
        cashier: ["regular"],
        regular: []
    }; 
    return <>
        {user ? <h2>Welcome {user.name}!</h2> : <h2>Welcome!</h2>}
        <div className="row">
            {user ? 
            (<>
                <Link to={`/${user.role}`}>Dashboard</Link>
                {clearance[user.role].map((role, index) => 
                    <Link key={index} to={`/${role}`}>{`${role.charAt(0).toUpperCase() + role.slice(1)} View`}</Link> )}
            </>) : 
            <Link to="/login">Login</Link>
            }
        </div>
    </>;
}

export default Home;
