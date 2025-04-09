import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAPI } from "../../contexts/APIContext";
import { useAuth } from "../../contexts/AuthContext";

export default function MyTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [limit, setLimit] = useState(5);
    const [filters, setFilters] = useState({
        transfer: false,
        redemption: false,
        purchase: false,
        adjustment: false,  
    });

    const { ajax } = useAPI();
    const navigate = useNavigate();
    const { user } = useAuth();
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
    }, [token, user]);

    const fetchTransactions = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const filterQuery = Object.entries(filters)
                .filter(([_, value]) => value)
                .map(([key]) => `type=${key}`)
                .join("&");

            const res = await ajax(
                `/users/me/transactions?page=${page}&limit=${limit}${
                    filterQuery ? `&${filterQuery}` : ""
                }`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (res.ok) {
                const data = await res.json();
                setTransactions(data.results || []);
                setTotalPages(Math.ceil(data.count / limit));
                setError("");
            } else {
                const errorData = await res.json();
                setError(errorData.error || "Failed to fetch transactions.");
            }
        } catch (err) {
            setError("An error occurred while fetching transactions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [user, page, limit, filters]);

    const handleFilterChange = (type) => {
        setFilters((prevFilters) => {
            if (prevFilters[type]) {
                return {
                    transfer: false,
                    redemption: false,
                    purchase: false,
                    adjustment: false,
                };
            }
            return {
                transfer: type === "transfer",
                redemption: type === "redemption",
                purchase: type === "purchase",
                adjustment: type === "adjustment",  
            };
        });
        setPage(1);
    };

    // Helper function to determine the style based on transaction type
    const getTransactionTypeStyle = (type) => {
        switch (type) {
            case "transfer":
                return { backgroundColor: "#d0f0c0", color: "#2c6b2f" }; 
            case "redemption":
                return { backgroundColor: "#f0c0c0", color: "#b64e41" }; 
            case "purchase":
                return { backgroundColor: "#cce0ff", color: "#004080" }; 
            case "adjustment":
                return { backgroundColor: "#fff2cc", color: "#cc8c00" }; 
            default:
                return {};
        }
    };

    return (
        <div>
            <h1>My Transactions</h1>
            {error && <p className="error">{error}</p>}
            {loading ? (
                <p>Loading transactions...</p>
            ) : (
                <>
                    <div style={{ marginBottom: "1rem" }}>
                        <label>
                            <input
                                type="checkbox"
                                checked={filters.transfer}
                                onChange={() => handleFilterChange("transfer")}
                            />
                            Transfer
                        </label>
                        <label style={{ marginLeft: "1rem" }}>
                            <input
                                type="checkbox"
                                checked={filters.redemption}
                                onChange={() => handleFilterChange("redemption")}
                            />
                            Redemption
                        </label>
                        <label style={{ marginLeft: "1rem" }}>
                            <input
                                type="checkbox"
                                checked={filters.purchase}
                                onChange={() => handleFilterChange("purchase")}
                            />
                            Purchase
                        </label>
                        <label style={{ marginLeft: "1rem" }}>
                            <input
                                type="checkbox"
                                checked={filters.adjustment}
                                onChange={() => handleFilterChange("adjustment")}
                            />
                            Adjustment
                        </label>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Utorid</th>
                                <th>Amount</th>
                                <th>Spent</th>
                                <th>Type</th>
                                <th>CreatedBy</th>
                                <th>Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length > 0 ? (
                                transactions.map((t) => (
                                    <tr
                                        key={t.id}
                                        style={getTransactionTypeStyle(t.type)}
                                    >
                                        <td>{t.utorid}</td>
                                        <td>{t.amount}</td>
                                        <td>{t.spent}</td>
                                        <td>{t.type}</td>
                                        <td>{t.createdBy}</td>
                                        <td>{t.remark}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: "center" }}>
                                        No transactions available.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginTop: "1rem",
                            gap: "1rem",
                        }}
                    >
                        <label htmlFor="limitSelect">Transactions per page:</label>
                        <select
                            id="limitSelect"
                            value={limit}
                            onChange={(e) => {
                                setPage(1);
                                setLimit(Number(e.target.value));
                            }}
                        >
                            {[2, 5, 10, 20].map((num) => (
                                <option key={num} value={num}>
                                    {num}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div
                        className="pagination"
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "1rem",
                            marginTop: "1.5rem",
                        }}
                    >
                        <button
                            disabled={page === 1}
                            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        >
                            Previous
                        </button>
                        <span style={{ minWidth: "120px", textAlign: "center" }}>
                            Page {totalPages === 0 ? 0 : page} of {totalPages}
                        </span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                        >
                            Next
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
