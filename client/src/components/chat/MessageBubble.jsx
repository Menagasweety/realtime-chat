const formatBytes = (size) => {
  if (!size) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let val = size;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(1)} ${units[i]}`;
};

const getReceiptLabel = (msg) => {
  if (!msg.receipts?.length) return 'sent';
  const allRead = msg.receipts.every((r) => r.readAt);
  if (allRead) return 'read';
  const allDelivered = msg.receipts.every((r) => r.deliveredAt);
  if (allDelivered) return 'delivered';
  return 'sent';
};

export default function MessageBubble({ msg, mine }) {
  const receiptLabel = mine ? getReceiptLabel(msg) : '';
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000';

  return (
    <article className={`bubble ${mine ? 'mine' : ''}`}>
      {!mine ? <small>@{msg.senderName}</small> : null}
      {msg.type === 'text' ? <p>{msg.text}</p> : null}
      {msg.type === 'image' ? (
        <img src={`${apiBase}${msg.fileUrl}`} alt={msg.fileName || 'image'} />
      ) : null}
      {msg.type === 'voice' ? (
        <audio controls src={`${apiBase}${msg.fileUrl}`} />
      ) : null}
      {msg.type === 'file' ? (
        <a
          className="file-bubble"
          href={`${apiBase}${msg.fileUrl}`}
          target="_blank"
          rel="noreferrer"
          download={msg.fileName || true}
        >
          <span>{msg.fileName}</span>
          <small>{formatBytes(msg.fileSize)}</small>
          <small>Download</small>
        </a>
      ) : null}
      <div className="bubble-meta">
        <time>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
        {mine ? <small className="receipt">{receiptLabel}</small> : null}
      </div>
    </article>
  );
}
