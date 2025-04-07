import { BACKEND_URL } from "../contexts/APIContext";
export default function UserProfile ({ user }) {
    const formatDate = (date) => {
      if (!date) return "N/A";
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(date).toLocaleDateString(undefined, options);
    };
  
    return (
        <>
        <h2>User Profile</h2>
  
        <div className="user-avatar">
          {user.avatarUrl ? (
            <img src={`${BACKEND_URL}${user.avatarUrl}`} alt="User Avatar" className="avatar" />
          ) : (
            <div className="avatar-placeholder">No Avatar</div>
          )}
        </div>
  
        <div className="user-info">
          <p><strong>UTorID:</strong> {user.utorid}</p>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Birthday:</strong> {user.birthday || "N/A"}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Points:</strong> {user.points}</p>
          <p><strong>Verified:</strong> {user.verified ? "Yes" : "No"}</p>
          {user.suspicious !== undefined && <p><strong>Suspicious:</strong> {user.suspicious ? "Yes" : "No"}</p>}
          <p><strong>Account Created:</strong> {formatDate(user.createdAt)}</p>
          <p><strong>Last Login:</strong> {formatDate(user.lastLogin)}</p>
        </div>
  
        <div className="promotions">
          <h3>Promotions</h3>
          {user.promotions && user.promotions.length > 0 ? (
            <ul>
              {user.promotions.map((promotion) => (
                <li key={promotion.id}>
                  <p><strong>Promotion:</strong> {promotion.name}</p>
                  <p><strong>Points:</strong> {promotion.points}</p>
                  <p><strong>Min Spending:</strong> {promotion.minSpending ? promotion.minSpending : "N/A"}</p>
                  <p><strong>Rate:</strong> {promotion.rate ? promotion.rate : "N/A"}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No promotions available.</p>
          )}
        </div>
      </>
    );
  };