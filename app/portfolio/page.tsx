'use client';

import Image from 'next/image';
import { useState } from 'react';

// Массив работ
const works = Array.from({ length: 61 }).map((_, i) => ({
  id: i + 1,
  src: `/${i + 1}.jpg`,
  title: `Работа №${i + 1}`
}));

export default function PortfolioPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Открыть лайтбокс
  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
    // Блокируем прокрутку страницы, когда лайтбокс открыт
    document.body.style.overflow = 'hidden';
  };

  // Закрыть лайтбокс
  const closeLightbox = () => {
    setIsOpen(false);
    document.body.style.overflow = 'auto'; // Возвращаем прокрутку
  };

  // Листать вперед/назад
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % works.length);
  };
  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + works.length) % works.length);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 relative">
      <h1 className="font-cinzel text-4xl text-center text-[#2c2a28] mb-4">Наши работы</h1>
      <p className="text-center text-[#5a5249] font-inter mb-12">Более 60 реализованных проектов</p>
      
      {/* Сетка карточек */}
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

      {/* =============== КАСТОМНЫЙ ЛАЙТБОКС =============== */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox} // Клик по фону закрывает
        >
          {/* Кнопка закрытия */}
          <button 
            onClick={closeLightbox}
            className="absolute top-6 right-6 text-white hover:text-[#b38b5d] text-4xl font-bold z-10 transition-colors"
          >
            ✕
          </button>

          {/* Кнопка "Назад" */}
          <button 
            onClick={(e) => { e.stopPropagation(); goToPrev(); }}
            className="absolute left-4 md:left-8 text-white hover:text-[#b38b5d] text-6xl font-bold z-10 transition-colors select-none"
          >
            ‹
          </button>

          {/* Кнопка "Вперед" */}
          <button 
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className="absolute right-4 md:right-8 text-white hover:text-[#b38b5d] text-6xl font-bold z-10 transition-colors select-none"
          >
            ›
          </button>

          {/* Само полноразмерное изображение */}
          <div 
            className="relative w-full h-full max-w-7xl max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()} // Чтобы клик по самой картинке не закрывал лайтбокс
          >
            <Image
              src={works[currentIndex].src}
              alt={works[currentIndex].title}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      )}
    </div>
  );
}