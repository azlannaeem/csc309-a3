import { useState, useEffect } from "react";
import { useAPI } from "../../contexts/APIContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function RedemptionRequest() {
    const [amount, setAmount] = useState("");
    const [remark, setRemark] = useState("");
    const [message, setMessage] = useState("");
    const { ajax } = useAPI();
    const { user } = useAuth();
    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
                navigate("/login");
            }
        }, [token, user]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const parsedAmount = parseInt(amount, 10);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setMessage("Error: Amount must be a positive number.");
            return;
        }

        try {
            const res = await ajax("/users/me/transactions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    type: "redemption",
                    amount: parsedAmount,
                    remark: remark || undefined,
                }),
            });

            if (res.ok) {
                setMessage("Redemption request submitted successfully!");
                setAmount("");
                setRemark("");
            } else {
                const error = await res.json();
                setMessage(`Error: ${error.error}`);
            }
        } catch (err) {
            setMessage("Error: Unable to complete the request.");
        }
    };

    return (
        <div>
            <h2>Request to Redeem Points</h2>
            <form onSubmit={handleSubmit}>
                <label>Amount:</label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                />
                <label>Remark (optional):</label>
                <input
                    type="text"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                />
                <button type="submit">Submit</button>
            </form>
            <p>{message}</p>
        </div>
    );
}