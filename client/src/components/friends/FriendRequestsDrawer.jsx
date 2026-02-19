export default function FriendRequestsDrawer({ open, requests, onAccept, onReject, onClose }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
        <h3>Friend Requests</h3>
        {requests.length === 0 ? <p>No pending requests.</p> : null}
        {requests.map((r) => (
          <div className="request-row" key={r.requestId}>
            <strong>@{r.fromUser.username}</strong>
            <div className="inline-actions">
              <button onClick={() => onAccept(r.requestId)}>Accept</button>
              <button className="ghost" onClick={() => onReject(r.requestId)}>
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
