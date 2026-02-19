import { useState } from 'react';

export default function CreateGroupModal({ open, friends, onCreate, onClose }) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState([]);

  if (!open) return null;

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const submit = () => {
    if (!name.trim()) return;
    onCreate({ name, memberIds: selected });
    setName('');
    setSelected([]);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
        <h3>Create Group</h3>
        <input
          placeholder="Group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="member-picker">
          {friends.map((f) => (
            <label key={String(f.id)} className="member-row">
              <input
                type="checkbox"
                checked={selected.includes(String(f.id))}
                onChange={() => toggle(String(f.id))}
              />
              <span>@{f.username}</span>
            </label>
          ))}
        </div>
        <button onClick={submit}>Create</button>
      </div>
    </div>
  );
}
