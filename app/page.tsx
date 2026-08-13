'use client';

import { useState } from 'react';
import Image from 'next/image';
import OrderForm from './components/OrderForm';

// Массив работ (от 1 до 61)
const works = Array.from({ length: 61 }).map((_, i) => ({
  id: i + 1,
  src: `/${i + 1}.jpg`,
  title: `Работа №${i + 1}`
}));

export default function Home() {
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
    <div className="flex flex-col gap-24 pb-24">
      
      {/* ================= БЛОК 1: ГЛАВНАЯ + КАЛЬКУЛЯТОР ================= */}
      <section id="calculator" className="min-h-screen flex items-center justify-center py-16 px-4 relative">
        <div className="absolute inset-0 pointer-events-none opacity-30"
             style={{ backgroundImage: `repeating-linear-gradient(45deg, #d6cfc4 0px, #d6cfc4 2px, transparent 2px, transparent 8px)`, backgroundSize: '20px 20px' }}>
        </div>

        <div className="relative z-10 max-w-5xl w-full flex flex-col md:flex-row items-center justify-center gap-12">
          <div className="hidden md:block w-16 h-96 bg-gradient-to-r from-[#e8e4de] to-[#d6cfc4] border-l-4 border-r-4 border-[#b38b5d]/30 shadow-lg rounded-sm"></div>

          <div className="flex-1 w-full">
            <div className="text-center mb-10">
              <div className="inline-block mb-2 bg-[#e8e4de] px-6 py-2 rounded-sm border border-[#b38b5d]/30 text-xs uppercase tracking-[0.3em] text-[#b38b5d] font-cinzel">ΕΛΛΑΣ (Эллада)</div>
              <h1 className="font-cinzel text-5xl md:text-6xl text-[#2c2a28] font-bold leading-tight">
                Античная <br /><span className="text-[#b38b5d]">лепнина</span>
              </h1>
              <p className="text-lg text-[#5a5249] font-inter mt-4 max-w-lg mx-auto leading-relaxed">
                Воссоздаем величие древних храмов. 15 лет опыта, индивидуальные проекты, выезд на замер.
              </p>
            </div>
            <OrderForm />
          </div>

          <div className="hidden md:block w-16 h-96 bg-gradient-to-r from-[#e8e4de] to-[#d6cfc4] border-l-4 border-r-4 border-[#b38b5d]/30 shadow-lg rounded-sm"></div>
        </div>
      </section>

      {/* ================= БЛОК 2: ПОРТФОЛИО ================= */}
      <section id="portfolio" className="max-w-6xl mx-auto px-6 w-full">
        <h1 className="font-cinzel text-4xl text-center text-[#2c2a28] mb-4">Наши работы</h1>
        <p className="text-center text-[#5a5249] font-inter mb-12">Более 60 реализованных проектов</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {works.map((work, index) => (
            <div 
              key={work.id} 
              onClick={() => openLightbox(index)}
              className="group relative overflow-hidden rounded-sm border border-[#b38b5d]/20 bg-[#fcfbf9] shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <div className="relative h-64 w-full">
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

        {/* Кастомный лайтбокс */}
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

      {/* ================= БЛОК 3: КОНТАКТЫ ================= */}
      <section id="contacts" className="max-w-2xl mx-auto w-full px-6 text-center">
        <h2 className="font-cinzel text-4xl text-[#2c2a28] mb-6">Свяжитесь с нами</h2>
        <p className="text-[#5a5249] font-inter mb-8">Оставьте заявку выше, или свяжитесь любым удобным способом</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#fcfbf9] border border-[#b38b5d]/20 rounded-sm p-8 shadow-lg">
          <div className="flex flex-col items-center gap-2 border-b md:border-b-0 md:border-r border-[#b38b5d]/20 pb-4 md:pb-0">
            <span className="text-xs uppercase tracking-widest text-[#b38b5d] font-cinzel">Телефон</span>
            <a href="tel:+79991234567" className="text-xl font-inter text-[#2c2a28] hover:text-[#b38b5d] transition">+7 (999) 123-45-67</a>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-[#b38b5d] font-cinzel">Email</span>
            <a href="mailto:info@ellada-decor.ru" className="text-xl font-inter text-[#2c2a28] hover:text-[#b38b5d] transition">info@ellada-decor.ru</a>
          </div>
        </div>
        
        <div className="mt-8 border border-[#b38b5d]/20 rounded-sm overflow-hidden h-64 md:h-80 shadow-lg">
           {/* Вставь сюда код Yandex или Google Карт (iframe) */}
           <iframe 
             src="https://yandex.ru/map-widget/v1/?um=constructor%3Aваш_ид_карты_или_адрес" 
             width="100%" height="100%" frameBorder="0" />
        </div>
      </section>
    </div>
  );
}