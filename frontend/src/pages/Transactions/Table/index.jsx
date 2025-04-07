import { useNavigate } from "react-router-dom";

export default function Table({transactions}) {
    const navigate = useNavigate();
    return (
        <table>
            <thead>
                <tr>
                    <th>utorid</th>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>Suspicious</th>
                    <th>Created By</th>
                </tr>
            </thead>
            <tbody>
                {transactions.map(t => (
                    <tr key={t.id} className="clickable" onClick={() => navigate(`/transactions/${t.id}`)}>
                        <td>{t.utorid}</td>
                        <td>{t.amount}</td>
                        <td>{t.type}</td>
                        <td>{t.suspicious === true ? "Yes" : "No"}</td>
                        <td>{t.createdBy}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}