import "./Layout.css";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Layout = () => {
    const { user, logout } = useAuth();
    return <>
        <header>
                <Link to="/">Home</Link>

                {user ? (
                    <>
                        <Link to={`/${user.role}`} className="user">
                            {user.utorid}
                        </Link>
                        <a href="#" onClick={logout}>Logout</a>
                    </>
                ) : (
                    <Link to="/login">Login</Link>
                )}
            </header>
        <main>
            <Outlet />
        </main>
        <footer>
            &copy; CSC309, A3
        </footer>
    </>;
};

export default Layout;
