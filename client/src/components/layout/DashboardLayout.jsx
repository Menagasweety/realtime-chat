import FriendsPanel from '../friends/FriendsPanel';
import ThemeSwitcher from '../ui/ThemeSwitcher';

export default function DashboardLayout({
  profile,
  tab,
  setTab,
  friendsProps,
  groups,
  onSelectGroup,
  onOpenGroupCreate,
  children,
  connected,
  themeProps,
  info,
  onRenameGroup,
  onAddGroupMember,
  onRemoveGroupMember,
  onLogout
}) {
  return (
    <main className="dashboard">
      {!connected ? <div className="reconnect-banner">Reconnecting...</div> : null}

      <aside className="sidebar glass-card">
        <section className="profile-card">
          <div className="avatar">{profile.username.slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>@{profile.username}</strong>
            <p>{connected ? 'Online' : `Last seen ${profile.lastSeen ? new Date(profile.lastSeen).toLocaleString() : 'recently'}`}</p>
          </div>
        </section>

        <nav className="tabs">
          {['friends', 'chats', 'groups'].map((k) => (
            <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>
              {k}
            </button>
          ))}
        </nav>

        {tab !== 'groups' ? (
          <FriendsPanel {...friendsProps} />
        ) : (
          <section className="groups-panel">
            <button onClick={onOpenGroupCreate}>+ Create Group</button>
            {groups.map((g) => (
              <button className="friend-row" key={String(g._id)} onClick={() => onSelectGroup(g)}>
                <div>
                  <strong>{g.name}</strong>
                  <p>{g.members.length} members</p>
                </div>
              </button>
            ))}
          </section>
        )}

        <ThemeSwitcher {...themeProps} />
        <button className="sidebar-logout" onClick={onLogout}>
          Logout
        </button>
      </aside>

      <section className="main-chat">{children}</section>

      <aside className="info-panel glass-card">
        <h4>{info?.title || 'Chat Info'}</h4>
        <p>{info?.subtitle || 'Pick a chat to view members and shared context.'}</p>
        {info?.chatType === 'group' && info?.isAdmin ? (
          <>
            <div className="rename-group">
              <input
                placeholder="Rename group"
                value={info.renameValue || ''}
                onChange={(e) => info.setRenameValue?.(e.target.value)}
              />
              <button onClick={onRenameGroup}>Rename Group</button>
            </div>
            <div className="group-admin-tools">
              {!info.showAddMemberList ? (
                <button onClick={info.toggleAddMemberList}>Add Member</button>
              ) : (
                <div className="add-member-list">
                  {(info.addCandidates || []).length === 0 ? (
                    <small className="muted">All friends are already in this group</small>
                  ) : (
                    (info.addCandidates || []).map((u) => (
                      <div key={u.id} className="add-member-row">
                        <span>@{u.username}</span>
                        <button onClick={() => onAddGroupMember?.(u.id)}>Add</button>
                      </div>
                    ))
                  )}
                  <button className="ghost" onClick={info.toggleAddMemberList}>
                    Close
                  </button>
                </div>
              )}
            </div>
          </>
        ) : null}
        {info?.members?.map((member) => (
          <div key={member.id} className="user-result">
            <span>@{member.username}</span>
            <div className="member-actions">
              <small>{member.online ? 'online' : `last seen ${member.lastSeen ? new Date(member.lastSeen).toLocaleString() : 'recently'}`}</small>
              {info?.chatType === 'group' && info?.isAdmin && String(member.id) !== String(profile.id) ? (
                <button className="ghost danger-btn" onClick={() => onRemoveGroupMember?.(member.id)}>
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </aside>
    </main>
  );
}
