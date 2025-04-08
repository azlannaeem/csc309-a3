import { useState, useEffect } from 'react';
import { useAPI } from '../../contexts/APIContext';

export default function CreateTransaction() {
    const [utorid, setUtorid] = useState('');
    const [amount, setAmount] = useState('');
    const [remark, setRemark] = useState('');
    const [promotionIds, setPromotionIds] = useState('');
    const [availablePromotions, setAvailablePromotions] = useState([]);
    const [message, setMessage] = useState('');
    const { ajax } = useAPI();
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchPromos = async () => {
            const resp = await ajax('/promotions', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (resp && resp.ok) {
                const data = await resp.json();
                console.log('Available promos: ', data);
                console.log('Available promos results: ', data.results);
                setAvailablePromotions(data.results || []);
            }
        };
        fetchPromos();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const promoList = promotionIds
            .split(',')
            .map((id) => parseInt(id.trim()))
            .filter((id) => !isNaN(id));

        const validPromoIds = availablePromotions.map((p) => p.id);
        const invalid = promoList.filter((id) => !validPromoIds.includes(id));
        if (invalid.length > 0) {
            setMessage(`Promotion ID ${invalid[0]} is not a valid promotion.`);
            return;
        }

        const resp = await ajax('/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                utorid,
                spent: parseFloat(amount),
                remark: remark || undefined,
                type: 'purchase',
                promotionIds: promoList,
            }),
        });

        if (resp.ok) {
            const json = await resp.json();
            setMessage(`Transaction ${json.id} created successfully!`);
            setUtorid('');
            setAmount('');
            setRemark('');
            setPromotionIds('');
        } else {
            const json = await resp.json();
            setMessage(`Error: ${json.error}`);
        }
    };

    return (
        <div>
            <h2>Create Transaction</h2>
            <form onSubmit={handleSubmit}>
                <label>User UTORid:</label>
                <input
                    value={utorid}
                    onChange={(e) => setUtorid(e.target.value)}
                    required
                />

                <label>Spent:</label>
                <input
                    value={amount}
                    type="number"
                    onChange={(e) => setAmount(e.target.value)}
                    required
                />

                <label>Remark:</label>
                <input
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                />
                <label htmlFor="promotionIds">
                    Promotion IDs (comma-separated):
                </label>
                <input
                    type="text"
                    name="promotionIds"
                    value={promotionIds}
                    onChange={(e) => setPromotionIds(e.target.value)}
                />

                <button type="submit">Create</button>
            </form>
            <p>{message}</p>
        </div>
    );
}
