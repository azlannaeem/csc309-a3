import { useState, useEffect, useMemo } from "react";
import Table from "./Table";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
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

export default function Transactions() {
    const navigate = useNavigate();
    const location = useLocation();
    const [transactions, setTransactions] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams(); 
    const [totalPages, setTotalPages] = useState(0);
    const [error, setError] = useState("");
    const { fetching, ajax } = useAPI();
    const { user } = useAuth();
    const token = localStorage.getItem("token");
    const clearance = ["superuser", "manager"];
    const {created} = location.state || {};

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
        const createdBy = searchParams.get("createdBy");
        if (createdBy) {
            result.createdBy = createdBy;
        }
        const suspicious = searchParams.get("suspicious");
        if (suspicious) {
            result.suspicious = suspicious;
        }
        const promotionId = searchParams.get("promotionId");
        if (promotionId) {
            result.promotionId = promotionId;
        }
        const type = searchParams.get("type");
        if (type) {
            result.type = type;
        }
        const relatedId = searchParams.get("relatedId");
        if (relatedId) {
            result.relatedId = relatedId;
        }
        const amount = searchParams.get("amount");
        if (amount) {
            result.amount = amount;
        }
        const operator = searchParams.get("operator");
        if (operator) {
            result.operator = operator;
        }
        result.page = searchParams.get("page") || "1";
        result.limit = searchParams.get("limit") || "10";
        return result;
    }, [searchParams]);
    
    const fetchUsers = async () => {
        const url = to_url(query, "/transactions");
        const headers = {Authorization: `Bearer ${token}`};
        const res = await ajax(url, { headers });
        if (res) {
            const json = await res.json();
            if (res.ok) {
                setTransactions(json.results || []);
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
            {created ? <h1>Transactions Created</h1> : <h1>Transactions</h1> }
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
                    <label htmlFor="createdBy">Created By:</label>
                    <input
                        type="text"
                        name="createdBy"
                        placeholder='Created By'
                        value={query.createdBy || ""}
                        onChange={(e) => handleChange(e)}
                    />
                </div>
                <div className="checkbox-container">
                    <label htmlFor="suspicious">Suspicious</label>
                    <input 
                        type='checkbox'
                        name="suspicious"
                        onChange={(e) => {
                            const updated = { ...query };
                            if (e.target.checked) {
                                updated.suspicious = "true";
                            } else {
                                delete updated.suspicious;
                            }
                            updated.page = 1;
                            setSearchParams(updated);
                        }}
                        checked={query.suspicious === "true"} 
                    />
                    <label htmlFor="unsuspicious">Unsuspicious</label>
                    <input 
                        type='checkbox'
                        name="unsuspicious" 
                        onChange={(e) => {
                            const updated = { ...query };
                            if (e.target.checked) {
                                updated.suspicious = "false";
                            } else {
                                delete updated.suspicious;
                            }
                            updated.page = 1;
                            setSearchParams(updated);
                        }}
                        checked={query.suspicious === "false"} 
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
                <div className="input-container">
                    <label htmlFor="relatedId">Related ID:</label>
                    <input 
                        type='number'
                        name="relatedId"
                        value={query.relatedId || ''}
                        min={0} 
                        onChange={(e) => handleChange(e)}
                    />
                </div>
                <div className="input-container">
                    <label htmlFor="amount">Amount:</label>
                    <input 
                        type='number'
                        name="amount"
                        value={query.amount || ''}
                        onChange={(e) => handleChange(e)}
                    />
                </div>
                <label htmlFor="operator">Operator</label>
                <select id="operator" name="operator" value={query.operator || ""} onChange={(e) => handleChange(e)}>
                    <option value="">-- Select Operator --</option>
                    <option value="gte">{"≥"}</option>
                    <option value="lte">{"≤"}</option>
                </select>
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
            {transactions.length > 0 && (
                <>
                    <Table transactions={transactions} />
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