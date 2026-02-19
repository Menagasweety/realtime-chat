import { useState } from 'react';

export default function Composer({ onSendText, onTyping }) {
  const [value, setValue] = useState('');

  const send = () => {
    if (!value.trim()) return;
    onSendText(value.trim());
    setValue('');
  };

  return (
    <div className="composer">
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onTyping();
        }}
        placeholder="Type your message..."
        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
      />
      <button onClick={send}>Send</button>
    </div>
  );
}
