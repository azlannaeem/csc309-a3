import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAPI } from "../../contexts/APIContext";
import { useAuth } from "../../contexts/AuthContext";
import { QRCodeCanvas } from "qrcode.react";

export default function UnprocessedRedemptions() {
    const [transactions, setTransactions] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [totalPages, setTotalPages] = useState(0);

    const { ajax } = useAPI();
    const { user } = useAuth();
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) navigate("/login");
    }, [token, user]);

    useEffect(() => {
        const fetchRedemptions = async () => {
            setLoading(true);
            try {
                const res = await ajax(`/users/me/transactions?type=redemption`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    const unprocessed = data.results.filter(
                        (t) => t.processedBy === undefined
                    );
                    setTransactions(unprocessed);
                    setTotalPages(Math.ceil(unprocessed.length / limit));
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

        fetchRedemptions();
    }, [user, token, limit]);

    const paginatedTransactions = transactions.slice(
        (page - 1) * limit,
        page * limit
    );

    return (
        <div>
            <h1>Unprocessed Redemption Requests</h1>
            {error && <p className="error">{error}</p>}
            {loading ? (
                <p>Loading redemption requests...</p>
            ) : paginatedTransactions.length > 0 ? (
                <>
                    <table>
                        <thead>
                            <tr>
                                <th>Utorid</th>
                                <th>Amount</th>
                                <th>CreatedBy</th>
                                <th>Remark</th>
                                <th>QR Code (Transaction ID)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTransactions.map((t) => (
                                <tr key={t.id}>
                                    <td>{t.utorid}</td>
                                    <td>{t.amount}</td>
                                    <td>{t.createdBy}</td>
                                    <td>{t.remark}</td>
                                    <td style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <QRCodeCanvas
                                            value={`Redemption Request ID: ${t.id.toString()}`}
                                            size={100}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "1rem" }}>
                        <label htmlFor="limitSelect">Requests per page:</label>
                        <select
                            id="limitSelect"
                            value={limit}
                            onChange={(e) => {
                                setPage(1);
                                setLimit(Number(e.target.value));
                            }}
                        >
                            {[2, 5, 10, 20].map((num) => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "1rem" }}>
                        <button
                            disabled={page === 1}
                            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        >
                            Previous
                        </button>
                        <span>
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
            ) : (
                <p>No unprocessed redemption requests.</p>
            )}
        </div>
    );
}