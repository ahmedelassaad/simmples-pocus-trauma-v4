import { useEffect, useState } from 'react';

export function Toast() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handler = (event) => {
      setMessage(event.detail);
      setTimeout(() => setMessage(''), 2200);
    };
    window.addEventListener('simm-toast', handler);
    return () => window.removeEventListener('simm-toast', handler);
  }, []);

  if (!message) return null;
  return <div className="toast">{message}</div>;
}
