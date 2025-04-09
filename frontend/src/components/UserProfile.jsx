import { BACKEND_URL } from "../contexts/APIContext";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import "./UserProfile.css";
export default function UserProfile ({ user, flag=false }) {
    const navigate = useNavigate();
    const formatDate = (dateString, isBirthday) => {
      if (!dateString) return "N/A";
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      var date;
      if (isBirthday) {
        const [year, month, day] = dateString.split('-');
        date = new Date(year, month - 1, day); 
      }
      else {
        date = new Date(dateString);
      }
      return date.toLocaleDateString('en-US', options);
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
          <p><strong>UtorID:</strong> {user.utorid}</p>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Birthday:</strong> {formatDate(user.birthday, true)}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Points:</strong> {user.points}</p>
          <p><strong>Verified:</strong> {user.verified ? "Yes" : "No"}</p>
          {user.suspicious !== undefined && <p><strong>Suspicious:</strong> {user.suspicious ? "Yes" : "No"}</p>}
          <p><strong>Account Created:</strong> {formatDate(user.createdAt, false)}</p>
          <p><strong>Last Login:</strong> {formatDate(user.lastLogin, false)}</p>
        </div>
  
        <div className="promotions">
          <h3>Promotions</h3>
          {user.promotions && user.promotions.length > 0 ? (
            <ul>
              {user.promotions.map((promotion) => (
                <li key={promotion.id} className={flag ? "clickable" : ""} {...(flag && { onClick: () => navigate(`/promotions/${promotion.id}`) })}>                  
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
        <div className="qr-code">
          <h3>QR Code</h3>
          <QRCodeCanvas value={user.id.toString()} size={150} />
          <p>Scan this QR code to get this user's id.</p>
        </div>
      </>
    );
  };