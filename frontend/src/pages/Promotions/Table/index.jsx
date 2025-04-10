import { useNavigate } from "react-router-dom";

export default function Table({promotions}) {
    const formatDate = (date) => {
        if (!date) return "N/A";
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true               
        };
        return new Date(date).toLocaleDateString(undefined, options);
    };
    const navigate = useNavigate();
    return (
        <div className="table-container">
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Min Spending</th>
                    <th>Rate</th>
                    <th>Points</th>
                </tr>
            </thead>
            <tbody>
                {promotions.map(p => (
                    <tr key={p.id} className="clickable" onClick={() => navigate(`/promotions/${p.id}`)}>
                        <td>{p.name}</td>
                        <td>{p.type}</td>
                        <td>{formatDate(p.startTime)}</td>
                        <td>{formatDate(p.endTime)}</td>
                        <td>{p.minSpending || "N/A"}</td>
                        <td>{p.rate || "N/A"}</td>
                        <td>{p.points}</td>
                    </tr>
                ))}
            </tbody>
        </table>
        </div>
    );
}