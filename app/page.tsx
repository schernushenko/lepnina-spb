'use client';

import { useState } from 'react';
import Image from 'next/image';
import OrderForm from './components/OrderForm';

// ... (Массив works оставляем тем же)
const works = Array.from({ length: 61 }).map((_, i) => ({
  id: i + 1,
  src: `/${i + 1}.jpg`,
  title: `Работа №${i + 1}`
}));

export default function Home() {
  // ... (Логика лайтбокса остается точно такой же)
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setIsOpen(false);
    document.body.style.overflow = 'auto';
  };

  const goToNext = () => setCurrentIndex((prev) => (prev + 1) % works.length);
  const goToPrev = () => setCurrentIndex((prev) => (prev - 1 + works.length) % works.length);

  return (
    <div className="flex flex-col">
      
      {/* ================= ГЛАВНАЯ (Hero) ================= */}
      <section id="home" className="min-h-screen flex items-center justify-center py-16 px-4 relative"
        data-aos="fade-in">
        <div className="text-center max-w-3xl z-10">
           <div className="inline-block mb-4 px-4 py-1 rounded-sm border border-[#b38b5d]/30 text-xs uppercase tracking-[0.3em] text-[#b38b5d] font-cinzel">ΕΛΛΑΣ (Эллада)</div>
           <h1 className="font-cinzel text-5xl md:text-7xl text-[#2c2a28] font-bold leading-tight">
             Античная <br /><span className="text-[#b38b5d]">лепнина</span>
           </h1>
           <p className="text-lg text-[#5a5249] font-inter mt-6 max-w-xl mx-auto leading-relaxed">
             15 лет опыта, индивидуальные проекты, выезд на замер.
           </p>
           <div className="mt-8">
             <a href="#portfolio" className="inline-block border border-[#b38b5d] text-[#b38b5d] px-8 py-3 hover:bg-[#b38b5d] hover:text-white transition uppercase tracking-widest font-cinzel shadow-sm hover:shadow-lg">
               Смотреть работы
             </a>
           </div>
        </div>
      </section>

      {/* ================= ПОРТФОЛИО ================= */}
      <section id="portfolio" className="max-w-6xl mx-auto px-6 w-full py-16">
        <h2 className="font-cinzel text-4xl text-center text-[#2c2a28] mb-4" data-aos="fade-up">Наши работы</h2>
        <p className="text-center text-[#5a5249] font-inter mb-12" data-aos="fade-up" data-aos-delay="100">Более 60 реализованных проектов</p>
        
        {/* Имитация сетки из шаблона */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {works.map((work, index) => (
            <div 
              key={work.id} 
              onClick={() => openLightbox(index)}
              data-aos="fade-up"
              data-aos-delay={index * 50}
              className="group relative overflow-hidden rounded-sm border border-[#b38b5d]/20 bg-[#fcfbf9] shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <div className="relative h-72 w-full">
                <Image
                  src={work.src}
                  alt={work.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={index === 0}
                />
              </div>
              <div className="p-4 text-center bg-[#fcfbf9]">
                <p className="text-sm uppercase tracking-widest text-[#b38b5d] font-cinzel">{work.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Твой кастомный лайтбокс */}
        {isOpen && (
          <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={closeLightbox}>
            <button onClick={closeLightbox} className="absolute top-6 right-6 text-white hover:text-[#b38b5d] text-4xl font-bold z-10 transition-colors">✕</button>
            <button onClick={(e) => { e.stopPropagation(); goToPrev(); }} className="absolute left-4 md:left-8 text-white hover:text-[#b38b5d] text-6xl font-bold z-10 transition-colors select-none">‹</button>
            <button onClick={(e) => { e.stopPropagation(); goToNext(); }} className="absolute right-4 md:right-8 text-white hover:text-[#b38b5d] text-6xl font-bold z-10 transition-colors select-none">›</button>
            <div className="relative w-full h-full max-w-7xl max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <Image src={works[currentIndex].src} alt={works[currentIndex].title} fill className="object-contain" sizes="100vw" priority />
            </div>
          </div>
        )}
      </section>

      {/* ================= КАЛЬКУЛЯТОР ================= */}
      <section id="calculator" className="max-w-5xl w-full px-4 mx-auto py-16">
        <div className="flex flex-col md:flex-row items-start justify-center gap-16 shadow-xl border border-[#b38b5d]/20 rounded-sm p-8 bg-[#fcfbf9]"
             data-aos="fade-up">
          <div className="flex-1 w-full">
            <h2 className="font-cinzel text-4xl text-center md:text-left text-[#2c2a28] mb-4">Рассчитайте заказ</h2>
            <p className="text-center md:text-left text-[#5a5249] font-inter mb-8">
              Выберите изделие, укажите количество. Цена пересчитается мгновенно.
            </p>
            <OrderForm />
          </div>
        </div>
      </section>

      {/* ================= КОНТАКТЫ ================= */}
      <section id="contacts" className="max-w-2xl mx-auto w-full px-6 text-center py-16">
        <h2 className="font-cinzel text-4xl text-[#2c2a28] mb-6" data-aos="fade-up">Свяжитесь с нами</h2>
        <p className="text-[#5a5249] font-inter mb-8" data-aos="fade-up" data-aos-delay="100">Оставьте заявку или позвоните по телефону</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#fcfbf9] border border-[#b38b5d]/20 rounded-sm p-8 shadow-sm"
             data-aos="fade-up">
          <div className="flex flex-col items-center gap-2 border-b md:border-b-0 md:border-r border-[#b38b5d]/20 pb-4 md:pb-0">
            <span className="text-xs uppercase tracking-widest text-[#b38b5d] font-cinzel">Телефон</span>
            <a href="tel:+79991234567" className="text-xl font-inter text-[#2c2a28] hover:text-[#b38b5d] transition">+7 (999) 123-45-67</a>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-[#b38b5d] font-cinzel">Email</span>
            <a href="mailto:info@ellada-decor.ru" className="text-xl font-inter text-[#2c2a28] hover:text-[#b38b5d] transition">info@ellada-decor.ru</a>
          </div>
        </div>
      </section>
    </div>
  );
}