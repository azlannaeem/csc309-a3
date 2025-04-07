import React, { useEffect, useState } from "react";
import { useAPI } from "../../contexts/APIContext";
import './styles.css'
import UserProfile from "../../components/UserProfile";
import UpdateUser from "../../components/UpdateUser";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import TransactionDetails from "../../components/TransactionDetails";

export default function Transaction({transactionId}) {
    const { ajax } = useAPI();
    const [transaction, setTransaction] = useState(null);
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
                <TransactionDetails transaction={transaction} />
                {transaction.suspicious ?
                 <button onClick={() => update(false) }>Mark Unsuspicious</button> : 
                 <button onClick={() => update(true)}>Mark Suspicious</button>}
                </>
            }
        </> 
}