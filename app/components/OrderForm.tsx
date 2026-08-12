'use client';

import { useState, type FormEvent } from 'react';

export default function OrderForm() {   // <-- обязательно default export
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/send-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, comment, estimatedPrice: 5000 }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'Ошибка отправки');
      }

      setSuccess(true);
      setName('');
      setPhone('');
      setComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить заявку. Попробуйте позвонить.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 border rounded">
      <h2 className="text-xl font-bold mb-4">Оставьте заявку</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ваше имя"
        required
        className="w-full p-2 border mb-2 rounded"
      />
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Телефон"
        required
        className="w-full p-2 border mb-2 rounded"
      />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Комментарий"
        rows={3}
        className="w-full p-2 border mb-2 rounded"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Отправка...' : 'Отправить'}
      </button>
      {success && <p className="text-green-600 mt-2">Заявка отправлена!</p>}
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </form>
  );
}