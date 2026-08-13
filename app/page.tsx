import OrderForm from './components/OrderForm';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f3efe8] text-[#2c2a28] flex items-center justify-center py-16 px-4 relative">
      
      {/* Античный мраморный фон (имитация через градиенты) */}
      <div className="absolute inset-0 pointer-events-none opacity-30"
           style={{ 
             backgroundImage: `repeating-linear-gradient(45deg, #d6cfc4 0px, #d6cfc4 2px, transparent 2px, transparent 8px)`,
             backgroundSize: '20px 20px'
           }}>
      </div>

      <div className="relative z-10 max-w-5xl w-full flex flex-col md:flex-row items-center justify-center gap-12">
        
        {/* Левая колонна (декоративная) */}
        <div className="hidden md:block w-16 h-96 bg-gradient-to-r from-[#e8e4de] to-[#d6cfc4] border-l-4 border-r-4 border-[#b38b5d]/30 shadow-lg rounded-sm"></div>

        {/* Центральный блок */}
        <div className="flex-1 w-full">
          <div className="text-center mb-10">
            <div className="inline-block mb-2 bg-[#e8e4de] px-6 py-2 rounded-sm border border-[#b38b5d]/30 text-xs uppercase tracking-[0.3em] text-[#b38b5d] font-cinzel">
              ΕΛΛΑΣ (Эллада)
            </div>
            <h1 className="font-cinzel text-5xl md:text-6xl text-[#2c2a28] font-bold leading-tight">
              Античная <br />
              <span className="text-[#b38b5d]">лепнина</span>
            </h1>
            <p className="text-lg text-[#5a5249] font-inter mt-4 max-w-lg mx-auto leading-relaxed">
              Воссоздаем величие древних храмов. 15 лет опыта, индивидуальные проекты, выезд на замер.
            </p>
          </div>

          {/* Форма */}
          <OrderForm />
        </div>

        {/* Правая колонна (декоративная) */}
        <div className="hidden md:block w-16 h-96 bg-gradient-to-r from-[#e8e4de] to-[#d6cfc4] border-l-4 border-r-4 border-[#b38b5d]/30 shadow-lg rounded-sm"></div>
      </div>

      {/* Нижний футер */}
      <footer className="absolute bottom-4 text-[10px] text-[#b38b5d] tracking-widest">
        © 2026 • Ο ΔΙΑΚΟΣΜΗΤΙΚΟΣ (Студия декора)
      </footer>
    </main>
  );
}