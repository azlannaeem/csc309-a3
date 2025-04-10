import { useState, useEffect, useMemo } from "react";
import Table from "./Table";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useAPI } from "../../contexts/APIContext";

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

export default function Promotions() {
    const navigate = useNavigate();
    const [promotions, setPromotions] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams(); 
    const [totalPages, setTotalPages] = useState(0);
    const [error, setError] = useState("");
    const { fetching, ajax } = useAPI();
    const { user } = useAuth();
    const token = localStorage.getItem("token");
    const clearance = ["superuser", "manager"];

    useEffect(() => {
        if (!token || (user && !clearance.includes(user.role))) {
            navigate("/login");
        }
    }, [token, user]);    
    
    
    const query = useMemo(() => {
        const result = {};
        const name = searchParams.get("name");
        if (name) {
            result.name = name;
        }
        const type = searchParams.get("type");
        if (type) {
            result.type = type;
        }
        const started = searchParams.get("started");
        if (started) {
            result.started = started;
        }
        const ended = searchParams.get("ended");
        if (ended) {
            result.ended = ended;
        }
        result.page = searchParams.get("page") || "1";
        result.limit = searchParams.get("limit") || "10";
        return result;
    }, [searchParams]);
    
    const fetchUsers = async () => {
        const url = to_url(query, "/promotions");
        const headers = {Authorization: `Bearer ${token}`};
        const res = await ajax(url, { headers });
        if (res) {
            const json = await res.json();
            if (res.ok) {
                setPromotions(json.results || []);
                setTotalPages(Math.ceil(json.count / query.limit));
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
            <h1>Promotions</h1>
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
                    <label htmlFor="type">Type:</label>
                    <input
                        type="text"
                        name="type"
                        placeholder='Type'
                        value={query.type || ""}
                        onChange={(e) => handleChange(e)}
                    />
                </div>
                <div className="checkbox-container">
                    <label htmlFor="started">Started</label>
                    <input 
                        type='checkbox'
                        name="started"
                        onChange={(e) => {
                            const updated = { ...query };
                            if (e.target.checked) {
                                updated.started = "true";
                                delete updated.ended;
                            } else {
                                delete updated.started;
                            }
                            updated.page = 1;
                            setSearchParams(updated);
                        }}
                        checked={query.started === "true"} 
                    />
                    <label htmlFor="notstarted">Not Started</label>
                    <input 
                        type='checkbox'
                        name="notstarted" 
                        onChange={(e) => {
                            const updated = { ...query };
                            if (e.target.checked) {
                                updated.started = "false";
                                delete updated.ended;
                            } else {
                                delete updated.started;
                            }
                            updated.page = 1;
                            setSearchParams(updated);
                        }}
                        checked={query.started === "false"} 
                    />
                    <label htmlFor="ended">Ended</label>
                    <input 
                        type='checkbox'
                        name="ended" 
                        onChange={(e) => {
                            const updated = { ...query };
                            if (e.target.checked) {
                                updated.ended = "true";
                                delete updated.started;
                            } else {
                                delete updated.ended;
                            }
                            updated.page = 1;
                            setSearchParams(updated);
                        }}
                        checked={query.ended === "true"} 
                    />
                    <label htmlFor="notended">Not Ended</label>
                    <input 
                        type='checkbox'
                        name="notended" 
                        onChange={(e) => {
                            const updated = { ...query };
                            if (e.target.checked) {
                                updated.ended = "false";
                                delete updated.started;
                            } else {
                                delete updated.ended;
                            }
                            updated.page = 1;
                            setSearchParams(updated);
                        }}
                        checked={query.ended === "false"} 
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
            {promotions.length > 0 && (
                <>
                    <Table promotions={promotions} />
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