import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAPI } from '../../contexts/APIContext';

export default function AwardPoints() {
    const { eventId } = useParams();
    const { ajax } = useAPI();
    const [utorid, setUtorid] = useState('');
    const [amount, setAmount] = useState('');
    const [remark, setRemark] = useState('');
    const [message, setMessage] = useState('');
    const token = localStorage.getItem('token');

    const handleAward = async (e) => {
        e.preventDefault();
        const data = {
            type: 'event',
            amount: parseInt(amount),
        };
        if (utorid) data.utorid = utorid;

        const res = await ajax(`/events/${eventId}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        const json = await res.json();
        setMessage(res.ok ? 'Points awarded!' : `Error: ${json.error}`);
    };

    return (
        <form onSubmit={handleAward}>
            <input
                placeholder="UTORid (optional)"
                value={utorid}
                onChange={(e) => setUtorid(e.target.value)}
            />
            <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
            />
            <button type="submit">Award Points</button>
            <p>{message}</p>
        </form>
    );
}
