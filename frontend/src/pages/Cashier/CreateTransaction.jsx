import { useState } from 'react';
import { useAPI } from '../../contexts/APIContext';

export default function CreateTransaction() {
  const [utorid, setUtorid] = useState('');
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [message, setMessage] = useState('');
  const { ajax } = useAPI();
  const token = localStorage.getItem('token');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const resp = await ajax('/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        utorid,
        spent: parseFloat(amount),
        remark,
        type: 'purchase'
      })
    });

    if (resp.ok) {
      setMessage('Transaction created successfully!');
      setUtorid('');
      setAmount('');
      setRemark('');
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
        <input value={utorid} onChange={e => setUtorid(e.target.value)} required />

        <label>Spent:</label>
        <input value={amount} type="number" onChange={e => setAmount(e.target.value)} required />

        <label>Remark:</label>
        <input value={remark} onChange={e => setRemark(e.target.value)} />

        <button type="submit">Create</button>
      </form>
      <p>{message}</p>
    </div>
  );
}