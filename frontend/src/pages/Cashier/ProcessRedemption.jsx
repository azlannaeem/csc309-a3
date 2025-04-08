import { useState } from 'react';
import { useAPI } from '../../contexts/APIContext';

export default function ProcessRedemption() {
  const [transactionId, setTransactionId] = useState('');
  const [message, setMessage] = useState('');
  const { ajax } = useAPI();
  const token = localStorage.getItem('token');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const resp = await ajax(`/redemptions/${transactionId}/process`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (resp.ok) {
      setMessage('Redemption processed!');
      setTransactionId('');
    } else {
      const json = await resp.json();
      setMessage(`Error: ${json.error}`);
    }
  };

  return (
    <div>
      <h2>Process Redemption</h2>
      <form onSubmit={handleSubmit}>
        <label>Redemption Request Transaction ID:</label>
        <input value={transactionId} onChange={e => setTransactionId(e.target.value)} required />

        <button type="submit">Process</button>
      </form>
      <p>{message}</p>
    </div>
  );
}
