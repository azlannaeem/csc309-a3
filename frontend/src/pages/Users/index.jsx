import { useState, useEffect, useMemo } from "react";
import Table from "./Table";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useAPI } from "../../contexts/APIContext";
import './styles.css'

function to_url(query, path) {
    var result = [];
    Object.keys(query).forEach(
        (key) => {
            const value = query[key];
            if (value) {
                result.push(`${key}=${value}`);
            }
        }
    );
    const params = result.join('&');
    if (params) {
        return `${path}?${params}`;
    }
    return path;
}

export default function Users() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams(); 
    const [totalPages, setTotalPages] = useState(0);
    const [error, setError] = useState("");
    const { fetching, ajax } = useAPI();
    const { user } = useAuth();
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token || (user && user.role !== "manager")) {
            navigate("/login");
        }
    }, []);    
    
    
    const query = useMemo(() => {
        const result = {};
        const name = searchParams.get("name");
        if (name) {
            result.name = name;
        }
        const role = searchParams.get("role");
        if (role) {
            result.role = role;
        }
        const verified = searchParams.get("verified");
        if (verified) {
            result.verified = verified;
        }
        const activated = searchParams.get("activated");
        if (activated) {
            result.activated = activated;
        }
        result.page = searchParams.get("page") || "1"
        result.limit = searchParams.get("limit") || "10"
        return result;
    }, [searchParams]);
    
    const fetchUsers = async () => {
        const url = to_url(query, "/users");
        const headers = {Authorization: `Bearer ${token}`};
        const res = await ajax(url, { headers });
        if (res) {
            const json = await res.json();
            if (res.ok) {
                setUsers(json.results || []);
                setTotalPages(Math.ceil(json.count / query.limit))
                setError("");
            }
            else {
                setError(json.error);
            }
        }
    }

    useEffect(() => {
        fetchUsers();
    }, [query]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const updated = { ...query, [name]: value, page: 1 };
        if (value === "") delete updated[name];
        setSearchParams(updated);
    };
    

    return (
        <>
            <h1>Users</h1>
            <div className="filters">
                <div className="input-container">
                    <label htmlFor="name">Name:</label>
                    <input type="text" 
                        name="name"
                        value={query.name || ""}
                        placeholder="Name"
                        onChange={e => handleChange(e)}
                    />
                </div>
                <div className="input-container">
                    <label htmlFor="role">Role:</label>
                    <input
                        type="text"
                        name="role"
                        placeholder='Role'
                        value={query.role || ""}
                        onChange={(e) => handleChange(e)}
                    />
                </div>
                <div className="checkbox-container">
                    <label htmlFor="verified">Verified</label>
                    <input 
                        type='checkbox'
                        name="verified"
                        onChange={(e) => {
                            const updated = { ...query };
                            if (e.target.checked) {
                                updated.verified = "true";
                            } else {
                                delete updated.verified;
                            }
                            updated.page = 1;
                            setSearchParams(updated);
                        }}
                        checked={query.verified === "true"} 
                    />
                    <label htmlFor="unverified">Unverified</label>
                    <input 
                        type='checkbox'
                        name="unverified" 
                        onChange={(e) => {
                            const updated = { ...query };
                            if (e.target.checked) {
                                updated.verified = "false";
                            } else {
                                delete updated.verified;
                            }
                            updated.page = 1;
                            setSearchParams(updated);
                        }}
                        checked={query.verified === "false"} 
                    />
                    <label htmlFor="activated">Activated</label>
                    <input 
                        type='checkbox'
                        name="activated" 
                        onChange={(e) => {
                            const updated = { ...query };
                            if (e.target.checked) {
                                updated.activated = "true";
                            } else {
                                delete updated.activated;
                            }
                            updated.page = 1;
                            setSearchParams(updated);
                        }}
                        checked={query.activated === "true"} 
                    />
                    <label htmlFor="unactivated">Unactivated</label>
                    <input 
                        type='checkbox'
                        name="unactivated" 
                        onChange={(e) => {
                            const updated = { ...query };
                            if (e.target.checked) {
                                updated.activated = "false";
                            } else {
                                delete updated.activated;
                            }
                            updated.page = 1;
                            setSearchParams(updated);
                        }}
                        checked={query.activated === "false"} 
                    />
                </div>
                <div className="input-container">
                    <label htmlFor="limit">Limit:</label>
                    <input 
                        type='number'
                        name="limit"
                        value={query.limit || 10}
                        min={1} 
                        onChange={(e) => handleChange(e)}
                    />
                </div>
                <div className="btn-container">
                    <button onClick={(e) => {
                        e.preventDefault();
                        setSearchParams({});
                        }}>Clear</button>
                </div>
                <p className="error">{error}</p>
            </div>
            {users.length > 0 && (
                <>
                    <Table users={users} />
                    <p className="btn-row">
                        {query.page > 1 && (
                            <button onClick={() => setSearchParams({...query, page: String(parseInt(query.page) - 1) })} disabled={fetching}>Previous</button>  
                        )}
                        {query.page < totalPages && (
                            <button onClick={() => setSearchParams({...query, page: String(parseInt(query.page) + 1) })} disabled={fetching}>Next</button> 
                        )}
                    </p>
                    <p>Page {query.page} out of {totalPages}.</p>
                </>
            )}
        </>
    );
}