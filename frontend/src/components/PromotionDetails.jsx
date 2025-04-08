
export default function PromotionDetails ({ promotion, created }) {
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
    return (
        <>
        {created? <h2>Promotion Created</h2> : <h2>Promotion Details</h2>}
        <div className="user-info">
          <p><strong>Name:</strong> {promotion.name}</p>
          <p><strong>Description:</strong> {promotion.description}</p>
          <p><strong>Type:</strong> {promotion.type}</p>
          <p><strong>Start Time:</strong> {formatDate(promotion.startTime)}</p>
          <p><strong>End Time:</strong> {formatDate(promotion.endTime)}</p>
          <p><strong>Min Spending:</strong> {promotion.minSpending || "N/A"}</p>
          <p><strong>Rate:</strong> {promotion.rate || "N/A"}</p>
          <p><strong>Points:</strong> {promotion.points}</p>
        </div>
      </>
    );
  };