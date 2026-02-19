export default function FriendsPanel({
  friends,
  onlineUserIds,
  activeFriendId,
  onOpenPrivate,
  search,
  setSearch,
  userResults,
  onSendRequest,
  onOpenRequests,
  pendingCount
}) {
  return (
    <section className="friends-panel">
      <div className="panel-header">
        <input
          className="search"
          placeholder="Search users / friends"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="ghost" onClick={onOpenRequests}>
          Requests {pendingCount > 0 ? `(${pendingCount})` : ''}
        </button>
      </div>

      {search.trim() ? (
        <div className="autocomplete glass-card">
          {userResults.map((u) => (
            <div key={u.id} className="user-result">
              <span>@{u.username}</span>
              {u.relation === 'none' ? (
                <button onClick={() => onSendRequest(u)}>Add</button>
              ) : (
                <small>{u.relation}</small>
              )}
            </div>
          ))}
          {userResults.length === 0 ? <small>No users found</small> : null}
        </div>
      ) : null}

      <div className="list">
        {friends.map((f) => {
          const online = onlineUserIds.includes(String(f.id));
          return (
            <button
              className={`friend-row ${activeFriendId === String(f.id) ? 'active' : ''}`}
              key={String(f.id)}
              onClick={() => onOpenPrivate(f)}
            >
              <span className={`online-dot ${online ? 'on' : 'off'}`} />
              <div>
                <strong>@{f.username}</strong>
                <p>{f.lastMessage?.text || f.lastMessage?.fileName || 'No messages yet'}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
