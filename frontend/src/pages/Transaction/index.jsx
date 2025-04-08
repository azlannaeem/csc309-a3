import React, { useEffect, useState } from "react";
import { useAPI } from "../../contexts/APIContext";
import './styles.css'
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import TransactionDetails from "../../components/TransactionDetails";

export default function Transaction({transactionId}) {
    const { ajax } = useAPI();
    const [transaction, setTransaction] = useState(null);
    const [amount, setAmount] = useState("");
    const [remark, setRemark] = useState("");
    const location = useLocation();
    const {created} = location.state || {};
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const clearance = ["superuser", "manager"];
    const { user } = useAuth();

    useEffect(() => {
        if (!token || (user && !clearance.includes(user.role))) {
            navigate("/login");
        }
    }, [token, user]); 

    async function fetchTransaction() {
        const path = `/transactions/${transactionId}`;
        const headers = { Authorization: `Bearer ${token}`};
        
        const res = await ajax(path, { headers });
        if (res.ok) {
            const json = await res.json();
            setTransaction(json);
            
        }
    }

    async function create() {
        if (amount === "0" || amount === "") {
            setError("Please specify adjustment amount.");
            return;
        }
        const path = `/transactions`;
        const method = 'POST';
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`};
        const updated = {
            utorid: transaction.utorid,
            type: "adjustment",
            amount: parseInt(amount),
            relatedId: transaction.id,
        };
        if (remark) {
            updated.remark = remark;
        }
        const body = JSON.stringify(updated);
        
        const res = await ajax(path, { method, headers, body });
        if (res) { 
            const json = await res.json(); 
            if (res.ok) {
                setError("");
                setAmount("");
                setRemark("");
                navigate(`/transactions/${json.id}`, {state: {created: true}}); 
            }   
            else {
                setError(json.error);
            }   
        }
    }

    async function update(suspicious) {
        const path = `/transactions/${transactionId}/suspicious`;
        const method = 'PATCH';
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`};
        const body = JSON.stringify({suspicious});
        
        const res = await ajax(path, { method, headers, body });
        if (res.ok) {
            const json = await res.json();
            setTransaction(json);
            
        }
    }
    useEffect(() => {
        fetchTransaction();
    }, [transactionId]);

    return <>
            {transaction && 
                <>
                <TransactionDetails transaction={transaction} created={created} />
                {transaction.suspicious ?
                 <button onClick={() => update(false) }>Mark Unsuspicious</button> : 
                 <button onClick={() => update(true)}>Mark Suspicious</button>}
                <div className="adjustment">
                <div className="amount"> 
                <label htmlFor="amount">Amount:</label>
                <input 
                    type='number'
                    name="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
                </div>
                <div className="amount"> 
                <label htmlFor="remark">Remark:</label>
                <textarea
                    name="remark"
                    rows={4}
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                />
                </div>
                <button onClick={() => create()}>Create adjustment</button>
                <p className="error">{error}</p>
                </div>
                </>
            }
        </> 
}