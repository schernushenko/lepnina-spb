'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

const products = [
  { id: 1, name: 'Ионическая колонна', unit: 'шт', price: 8500 },
  { id: 2, name: 'Потолочная розетка (Меандр)', unit: 'шт', price: 4200 },
  { id: 3, name: 'Карниз (Греческий профиль)', unit: 'м.п.', price: 1800 },
  { id: 4, name: 'Кронштейн с волютами', unit: 'шт', price: 3900 },
];

type FormData = {
  name: string;
  phone: string;
  comment: string;
  productId: string;
  quantity: number;
};

export default function OrderForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, reset } = useForm<FormData>({
    defaultValues: { quantity: 1 }
  });

  const selectedProductId = watch('productId');
  const quantity = watch('quantity') || 0;

  const selectedProduct = products.find(p => p.id === Number(selectedProductId));
  const totalPrice = selectedProduct ? selectedProduct.price * quantity : 0;

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/send-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          comment: data.comment,
          estimatedPrice: totalPrice,
          product: selectedProduct?.name
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error ?? 'Ошибка отправки');
      }

      setSuccess(true);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка. Позвоните по телефону.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-[#fcfbf9] rounded-sm shadow-2xl border-2 border-[#b38b5d]/50 relative overflow-hidden">
      
      {/* Декоративная греческая кайма (Меандр) - сверху */}
      <div className="h-3 w-full bg-[repeating-linear-gradient(45deg, #b38b5d 0px, #b38b5d 4px, transparent 4px, transparent 8px, #b38b5d 8px, #b38b5d 12px, transparent 12px, transparent 16px)]"></div>

      {/* Калькулятор */}
      <div className="bg-[#e8e4de] p-6 border-b border-[#b38b5d]/30">
        <h3 className="font-cinzel text-xl text-[#2c2a28] tracking-wider text-center">Αγορά & Πωληση</h3> {/* Покупка и продажа по-гречески */}
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <select
            {...register('productId')}
            className="flex-1 bg-[#fcfbf9] border border-[#b38b5d]/50 rounded-sm p-2 text-[#2c2a28] font-cinzel tracking-wide"
          >
            <option value="">Выберите изделие</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div className="flex-1 flex items-center gap-2">
            <input
              type="number"
              min="1"
              {...register('quantity', { valueAsNumber: true, min: 1 })}
              className="w-full bg-[#fcfbf9] border border-[#b38b5d]/50 rounded-sm p-2 text-[#2c2a28]"
              placeholder="Кол-во"
            />
            <span className="text-[#b38b5d] font-cinzel text-sm w-12">{selectedProduct?.unit || 'ед.'}</span>
          </div>
        </div>
        {selectedProduct && (
          <div className="mt-4 p-3 bg-[#fcfbf9] border border-[#b38b5d]/30 flex justify-between items-center shadow-inner">
            <span className="text-[#2c2a28] uppercase tracking-widest text-xs font-cinzel">Примерная стоимость:</span>
            <span className="text-3xl font-cinzel font-bold text-[#b38b5d]">
              {totalPrice.toLocaleString()} ₽
            </span>
          </div>
        )}
      </div>

      {/* Форма заявки */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-8 bg-[#fcfbf9]">
        <h2 className="font-cinzel text-2xl text-[#2c2a28] text-center border-b border-[#b38b5d]/30 pb-4 mb-6 tracking-widest uppercase">
          Оставить запрос
        </h2>
        
        <input
          type="text"
          {...register('name', { required: 'Введите имя' })}
          placeholder="Ваше имя"
          className="w-full p-3 bg-[#f4f1ec] border border-[#b38b5d]/30 rounded-sm mb-3 focus:outline-none focus:border-[#b38b5d] transition"
        />
        <input
          type="tel"
          {...register('phone', { required: 'Введите телефон' })}
          placeholder="Телефон"
          className="w-full p-3 bg-[#f4f1ec] border border-[#b38b5d]/30 rounded-sm mb-3 focus:outline-none focus:border-[#b38b5d] transition"
        />
        <textarea
          {...register('comment')}
          placeholder="Ваши пожелания или вопросы по замеру"
          rows={3}
          className="w-full p-3 bg-[#f4f1ec] border border-[#b38b5d]/30 rounded-sm mb-6 focus:outline-none focus:border-[#b38b5d] transition"
        />
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#b38b5d] hover:bg-[#9e7b4f] text-[#fcfbf9] font-cinzel tracking-widest uppercase py-3 px-6 rounded-sm transition duration-300 disabled:opacity-50 shadow-md"
        >
          {loading ? 'Отправка...' : 'Отправить заявку'}
        </button>

        {success && <p className="text-[#b38b5d] mt-4 text-sm bg-[#f4f1ec] p-2 rounded-sm border border-[#b38b5d]/30 text-center">✓ Заявка принята. Ждите вестей от Афины!</p>}
        {error && <p className="text-[#9e4e3c] mt-4 text-sm bg-[#f4f1ec] p-2 rounded-sm border border-[#9e4e3c]/30 text-center">✗ {error}</p>}
      </form>
      
      {/* Декоративная греческая кайма - снизу */}
      <div className="h-3 w-full bg-[repeating-linear-gradient(45deg, #b38b5d 0px, #b38b5d 4px, transparent 4px, transparent 8px, #b38b5d 8px, #b38b5d 12px, transparent 12px, transparent 16px)]"></div>
    </div>
  );
}