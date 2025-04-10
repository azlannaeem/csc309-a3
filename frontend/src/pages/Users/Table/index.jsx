import { useNavigate } from "react-router-dom";

export default function Table({users}) {
    const navigate = useNavigate();
    return (
        <div className="table-container">
        <table>
            <thead>
                <tr>
                    <th>utorid</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Points</th>
                </tr>
            </thead>
            <tbody>
                {users.map(user => (
                    <tr key={user.id} className="clickable" onClick={() => navigate(`/users/${user.id}`)}>
                        <td>{user.utorid}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>{user.points}</td>
                    </tr>
                ))}
            </tbody>
        </table>
        </div>
    );
}