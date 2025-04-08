import { useNavigate } from "react-router-dom";

export default function TransactionDetails ({ transaction, created }) {
    const navigate = useNavigate();
    function handle_click() {
      if (transaction.type === "adjustment") {
        navigate(`/transactions/${transaction.relatedId}`);
      }
      if (transaction.type === "transfer" || transaction.type === "redemption") {
        navigate(`/users/${transaction.relatedId}`);
      }
    }
    const remark = transaction.remark || "None";
    return (
        <>
        {created ? 
        <h2>Adjustment Created</h2> :
        <h2>Transaction Details</h2>
      }
  
        <div className="user-info">
          <p><strong>UtorID:</strong> {transaction.utorid}</p>
          <p><strong>Type:</strong> {transaction.type}</p>
          {transaction.spent !== undefined && <p><strong>Spent:</strong> {transaction.spent}</p>}
          <p><strong>Amount:</strong> {transaction.amount}</p>
          <p><strong>Promotion IDs:</strong> {transaction.promotionIds.join(', ') || "None"}</p>
          <p><strong>Suspicious:</strong> {transaction.suspicious ? "Yes" : "No"}</p>
          {transaction.relatedId && <p className="clickable" onClick={handle_click}><strong>Related ID:</strong> {transaction.relatedId}</p>}
          {transaction.redeemed !== undefined && <p><strong>Redeemed:</strong> {transaction.redeemed}</p>}
          <p><strong>Remark:</strong> {remark}</p>
          <p><strong>Created By:</strong> {transaction.createdBy}</p>
        </div>
      </>
    );
  };