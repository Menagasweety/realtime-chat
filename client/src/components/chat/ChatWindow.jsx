import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import Composer from './Composer';
import { Skeleton } from '../ui/Skeleton';

export default function ChatWindow({
  loading,
  header,
  messages,
  meId,
  typingUsers,
  composerEnabled,
  hasMore,
  loadingMore,
  onLoadMore,
  onSendText,
  onTyping
}) {
  const listRef = useRef(null);
  const loadingOlderRef = useRef(false);

  const handleScroll = async () => {
    const list = listRef.current;
    if (!list || !hasMore || loadingMore || !onLoadMore) return;
    if (list.scrollTop > 80) return;
    loadingOlderRef.current = true;
    const prevHeight = list.scrollHeight;
    await onLoadMore();
    requestAnimationFrame(() => {
      list.scrollTop = list.scrollHeight - prevHeight;
      loadingOlderRef.current = false;
    });
  };

  useEffect(() => {
    const list = listRef.current;
    if (!list || loadingOlderRef.current) return;
    list.scrollTop = list.scrollHeight;
  }, [messages.length]);

  return (
    <section className="chat-window glass-card">
      <header className="chat-header">
        <h2>{header.title}</h2>
        <p>{header.subtitle}</p>
      </header>

      <div className="message-area" ref={listRef} onScroll={handleScroll}>
        {loadingMore ? <small className="muted">Loading older messages...</small> : null}
        {loading ? <Skeleton lines={6} /> : null}
        {!loading && messages.length === 0 ? (
          <p className="muted center-note">
            {composerEnabled ? 'Start the conversation' : 'Select a friend or group to start chatting'}
          </p>
        ) : null}
        {messages.map((m) => (
          <MessageBubble key={String(m._id)} msg={m} mine={String(m.senderId) === String(meId)} />
        ))}
        {typingUsers.length > 0 ? (
          <div className="typing-indicator">
            <span />
            <span />
            <span />
            <small>{typingUsers.join(', ')} typing...</small>
          </div>
        ) : null}
      </div>

      {composerEnabled ? (
        <Composer onSendText={onSendText} onTyping={onTyping} />
      ) : null}
    </section>
  );
}
