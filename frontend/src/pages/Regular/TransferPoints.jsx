import { useState } from "react";
import { useAPI } from "../../contexts/APIContext";

export default function TransferPoints() {
    const { ajax } = useAPI();
    const [userId, setUserId] = useState("");
    const [amount, setAmount] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        const parsedUserId = parseInt(userId, 10);
        if (isNaN(parsedUserId)) {
            setMessage("Error: User ID must be a valid number.");
            return;
        }

        const parsedAmount = parseInt(amount, 10);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setMessage("Error: Amount must be a positive number.");
            return;
        }

        try {
            const res = await ajax(`/users/${parsedUserId}/transactions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ type: "transfer", amount: parsedAmount }),
            });

            if (res.ok) {
                setMessage("Points transferred successfully!");
                setUserId("");
                setAmount("");
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
            <h2>Transfer Points</h2>
            <form onSubmit={handleSubmit}>
                <label>User ID:</label>
                <input
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    required
                />
                <label>Amount:</label>
                <input
                    value={amount}
                    type="number"
                    onChange={(e) => setAmount(e.target.value)}
                    required
                />
                <button type="submit">Transfer</button>
            </form>
            <p>{message}</p>
        </div>
    );
}