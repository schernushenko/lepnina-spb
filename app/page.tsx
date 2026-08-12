import OrderForm from './components/OrderForm';

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Лепные работы на заказ</h1>
      <p>15 лет опыта. Выезд на замер.</p>
      <OrderForm />
    </main>
  );
}