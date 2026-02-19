import { useEffect, useMemo, useRef, useState } from 'react';
import { authApi } from '../api/authApi';
import { chatsApi } from '../api/chatsApi';
import { friendsApi, usersApi } from '../api/friendsApi';
import { groupsApi } from '../api/groupsApi';
import { useSocket } from '../hooks/useSocket';
import DashboardLayout from '../components/layout/DashboardLayout';
import ChatWindow from '../components/chat/ChatWindow';
import ToastStack from '../components/ui/ToastStack';
import FriendRequestsDrawer from '../components/friends/FriendRequestsDrawer';
import CreateGroupModal from '../components/groups/CreateGroupModal';

export default function DashboardPage({ user, onLogout }) {
  const [tab, setTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [renameValue, setRenameValue] = useState('');
  const [showAddMemberList, setShowAddMemberList] = useState(false);

  const typingTimeout = useRef(null);
  const { socket, connected } = useSocket(Boolean(user));

  const pushToast = (message) => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const refreshFriends = async () => {
    const { data } = await friendsApi.list();
    setFriends(data.friends);
    setPendingRequests(data.pendingReceived);
  };

  const refreshGroups = async () => {
    const { data } = await groupsApi.list();
    setGroups(data.groups);
  };

  useEffect(() => {
    refreshFriends();
    refreshGroups();
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!search.trim()) return setUserResults([]);
    const t = setTimeout(async () => {
      try {
        const { data } = await usersApi.search(search);
        setUserResults(data.users || []);
      } catch {
        setUserResults([]);
      }
    }, 180);
    return () => clearTimeout(t);
  }, [search]);

  const applyPage = (data) => {
    setMessages(data.messages || []);
    setHasMore(Boolean(data.hasMore));
    setNextBefore(data.nextBefore || null);
  };

  const openPrivate = async (friend) => {
    setTab('chats');
    setLoadingMessages(true);
    const { data } = await chatsApi.privateConversation(String(friend.id));
    const conversationId = data.conversation._id;

    setActiveChat({
      chatType: 'private',
      targetId: String(conversationId),
      friendId: String(friend.id),
      title: `@${friend.username}`,
      subtitle: onlineUserIds.includes(String(friend.id)) ? 'Online' : 'Offline',
      members: [
        {
          id: String(friend.id),
          username: friend.username,
          online: onlineUserIds.includes(String(friend.id)),
          lastSeen: friend.lastSeen
        }
      ]
    });

    const history = await chatsApi.privateMessages(conversationId, { limit: 30 });
    applyPage(history.data);
    setLoadingMessages(false);

    socket?.emit('room:join', { chatType: 'private', targetId: String(conversationId) });
    socket?.emit('message:read', { chatType: 'private', conversationId: String(conversationId) });
  };

  const openGroup = async (group) => {
    setLoadingMessages(true);
    setRenameValue(group.name);
    setShowAddMemberList(false);

    const isAdmin = (group.admins || []).some((a) => String(a._id || a) === String(user.id));

    setActiveChat({
      chatType: 'group',
      targetId: String(group._id),
      groupId: String(group._id),
      title: group.name,
      subtitle: `${group.members.length} members`,
      isAdmin,
      admins: (group.admins || []).map((a) => String(a._id || a)),
      members: group.members.map((m) => ({
        id: String(m._id || m),
        username: m.username || 'member',
        online: onlineUserIds.includes(String(m._id || m)),
        lastSeen: m.lastSeen
      }))
    });

    const history = await groupsApi.messages(group._id, { limit: 30 });
    applyPage(history.data);
    setLoadingMessages(false);

    socket?.emit('room:join', { chatType: 'group', targetId: String(group._id) });
    socket?.emit('message:read', { chatType: 'group', groupId: String(group._id) });
  };

  const refreshAndReopenActiveGroup = async (groupId) => {
    const { data } = await groupsApi.list();
    setGroups(data.groups);
    const updated = data.groups.find((g) => String(g._id) === String(groupId));
    if (updated) await openGroup(updated);
  };

  const loadMore = async () => {
    if (!activeChat || !hasMore || loadingMore || !nextBefore) return;
    setLoadingMore(true);

    const params = { limit: 30, before: nextBefore };
    const response =
      activeChat.chatType === 'private'
        ? await chatsApi.privateMessages(activeChat.targetId, params)
        : await groupsApi.messages(activeChat.targetId, params);

    const older = response.data.messages || [];
    setMessages((prev) => [...older, ...prev]);
    setHasMore(Boolean(response.data.hasMore));
    setNextBefore(response.data.nextBefore || null);
    setLoadingMore(false);
  };

  useEffect(() => {
    if (!socket) return;

    const onlineHandler = ({ userIds }) => {
      setOnlineUserIds(userIds);
      setActiveChat((prev) => {
        if (!prev?.members) return prev;
        return {
          ...prev,
          members: prev.members.map((m) => ({ ...m, online: userIds.includes(String(m.id)) }))
        };
      });
    };

    const messageHandler = ({ chatType, targetId, savedMessage }) => {
      const active = activeChat && activeChat.chatType === chatType && activeChat.targetId === String(targetId);
      if (active) {
        setMessages((prev) =>
          prev.some((m) => String(m._id) === String(savedMessage._id)) ? prev : [...prev, savedMessage]
        );
        if (String(savedMessage.senderId) !== String(user.id)) {
          socket.emit(
            'message:read',
            chatType === 'private'
              ? { chatType: 'private', conversationId: String(targetId) }
              : { chatType: 'group', groupId: String(targetId) }
          );
        }
      }
    };

    const notifyHandler = ({ savedMessage }) => {
      if (String(savedMessage.senderId) === String(user.id)) return;
      pushToast(`New message from @${savedMessage.senderName}`);
      refreshFriends();
    };

    const receiptHandler = ({ messageId, userId: receiptUserId, status, at }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (String(m._id) !== String(messageId)) return m;
          const receipts = [...(m.receipts || [])];
          const index = receipts.findIndex((r) => String(r.userId) === String(receiptUserId));
          if (index === -1) return m;
          const next = { ...receipts[index] };
          if (status === 'delivered' && !next.deliveredAt) next.deliveredAt = at;
          if (status === 'read') {
            if (!next.deliveredAt) next.deliveredAt = at;
            next.readAt = at;
          }
          receipts[index] = next;
          return { ...m, receipts };
        })
      );
    };

    const typingStart = ({ chatType, conversationId, groupId, user: typingUser }) => {
      if (!activeChat) return;
      const id = conversationId || groupId;
      if (activeChat.chatType !== chatType || activeChat.targetId !== String(id)) return;
      setTypingUsers((prev) => (prev.some((u) => u.id === typingUser.id) ? prev : [...prev, typingUser]));
    };

    const typingStop = ({ userId: typingUserId }) => {
      setTypingUsers((prev) => prev.filter((u) => u.id !== typingUserId));
    };

    const friendReqNew = ({ fromUser }) => {
      pushToast(`Friend request from @${fromUser.username}`);
      refreshFriends();
    };

    socket.on('users:online', onlineHandler);
    socket.on('message:new', messageHandler);
    socket.on('message:notify', notifyHandler);
    socket.on('message:receipt:update', receiptHandler);
    socket.on('typing:start', typingStart);
    socket.on('typing:stop', typingStop);
    socket.on('friend:request:new', friendReqNew);
    socket.on('friend:request:update', refreshFriends);

    return () => {
      socket.off('users:online', onlineHandler);
      socket.off('message:new', messageHandler);
      socket.off('message:notify', notifyHandler);
      socket.off('message:receipt:update', receiptHandler);
      socket.off('typing:start', typingStart);
      socket.off('typing:stop', typingStop);
      socket.off('friend:request:new', friendReqNew);
      socket.off('friend:request:update', refreshFriends);
    };
  }, [socket, activeChat, user.id]);

  const sendText = (text) => {
    if (!activeChat || !socket) return;
    socket.emit('message:send', {
      chatType: activeChat.chatType,
      targetId: activeChat.targetId,
      messagePayload: { type: 'text', text }
    });
  };

  const emitTyping = () => {
    if (!activeChat || !socket) return;
    socket.emit(
      'typing:start',
      activeChat.chatType === 'private'
        ? { chatType: 'private', conversationId: activeChat.targetId }
        : { chatType: 'group', groupId: activeChat.targetId }
    );

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit(
        'typing:stop',
        activeChat.chatType === 'private'
          ? { chatType: 'private', conversationId: activeChat.targetId }
          : { chatType: 'group', groupId: activeChat.targetId }
      );
    }, 900);
  };

  const renameGroup = async () => {
    if (!activeChat || activeChat.chatType !== 'group' || !activeChat.isAdmin) return;
    const nextName = renameValue.trim();
    if (!nextName || nextName === activeChat.title) return;

    await groupsApi.rename(activeChat.groupId, nextName);
    await refreshAndReopenActiveGroup(activeChat.groupId);
    pushToast('Group renamed');
  };

  const addGroupMember = async (memberId) => {
    if (!activeChat || activeChat.chatType !== 'group' || !activeChat.isAdmin || !memberId) return;
    await groupsApi.addMember(activeChat.groupId, memberId);
    await refreshAndReopenActiveGroup(activeChat.groupId);
    setShowAddMemberList(false);
    pushToast('Member added');
  };

  const removeGroupMember = async (memberId) => {
    if (!activeChat || activeChat.chatType !== 'group' || !activeChat.isAdmin) return;
    await groupsApi.removeMember(activeChat.groupId, memberId);
    await refreshAndReopenActiveGroup(activeChat.groupId);
    pushToast('Member removed');
  };

  const addCandidates =
    activeChat?.chatType === 'group'
      ? friends.filter((f) => !activeChat.members.some((m) => String(m.id) === String(f.id)))
      : [];

  const header = useMemo(
    () => ({
      title: activeChat?.title || 'Select a chat',
      subtitle: activeChat?.subtitle || 'Your messages live here'
    }),
    [activeChat]
  );

  return (
    <>
      <DashboardLayout
        profile={user}
        tab={tab}
        setTab={setTab}
        connected={connected}
        friendsProps={{
          friends,
          activeFriendId: activeChat?.friendId,
          onlineUserIds,
          onOpenPrivate: openPrivate,
          search,
          setSearch,
          userResults,
          onSendRequest: async (u) => {
            try {
              await friendsApi.sendRequest({ targetUserId: u.id });
              pushToast(`Request sent to @${u.username}`);
              refreshFriends();
            } catch (err) {
              pushToast(err?.response?.data?.message || 'Failed to send friend request');
            }
          },
          onOpenRequests: () => setRequestsOpen(true),
          pendingCount: pendingRequests.length
        }}
        groups={groups}
        onSelectGroup={openGroup}
        onOpenGroupCreate={() => setGroupModalOpen(true)}
        themeProps={{ theme, setTheme }}
        info={{
          title: activeChat?.title,
          subtitle: activeChat?.subtitle,
          members: activeChat?.members || [],
          chatType: activeChat?.chatType,
          isAdmin: activeChat?.isAdmin,
          renameValue,
          setRenameValue,
          addCandidates,
          showAddMemberList,
          toggleAddMemberList: () => setShowAddMemberList((prev) => !prev)
        }}
        onRenameGroup={renameGroup}
        onAddGroupMember={addGroupMember}
        onRemoveGroupMember={removeGroupMember}
        onLogout={async () => {
          await authApi.logout();
          onLogout();
        }}
      >
        <ChatWindow
          loading={loadingMessages}
          header={header}
          messages={messages}
          meId={user.id}
          typingUsers={typingUsers.map((u) => u.username)}
          composerEnabled={Boolean(activeChat)}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
          onSendText={sendText}
          onTyping={emitTyping}
        />
      </DashboardLayout>

      <ToastStack toasts={toasts} />

      <FriendRequestsDrawer
        open={requestsOpen}
        requests={pendingRequests}
        onClose={() => setRequestsOpen(false)}
        onAccept={async (requestId) => {
          await friendsApi.accept(requestId);
          await refreshFriends();
          setRequestsOpen(false);
        }}
        onReject={async (requestId) => {
          await friendsApi.reject(requestId);
          await refreshFriends();
          setRequestsOpen(false);
        }}
      />

      <CreateGroupModal
        open={groupModalOpen}
        friends={friends}
        onClose={() => setGroupModalOpen(false)}
        onCreate={async (payload) => {
          await groupsApi.create(payload);
          await refreshGroups();
          setGroupModalOpen(false);
        }}
      />
    </>
  );
}
