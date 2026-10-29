'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import OrderForm from './components/OrderForm';

interface Work {
  id: number;
  src: string;
  title: string;
  active: boolean;
}

interface CompanyConfig {
  name: string;
  phone: string;
  email: string;
  description: string;
}

const initialWorks: Work[] = Array.from({ length: 61 }, (_, index) => ({
  id: index + 1,
  src: `/${index + 1}.jpg`,
  title: `Работа №${index + 1}`,
  active: true
}));

const initialConfig: CompanyConfig = {
  name: 'Античная лепнина',
  phone: '+7 (999) 123-45-67',
  email: 'info@ellada-decor.ru',
  description: '15 лет опыта, индивидуальные проекты, выезд на замер.'
};

const processSteps = [
  {
    number: '01',
    title: 'Знакомимся',
    description: 'Обсуждаем задумку, стиль интерьера и то, каким вы хотите видеть результат.',
    icon: 'M8 12h8M8 16h5M9 3h6l4 4v14H5V3h4zm6 0v5h5'
  },
  {
    number: '02',
    title: 'Подбираем',
    description: 'Помогаем сочетать профили и орнаменты, рассчитываем материалы и стоимость.',
    icon: 'M12 3 3.5 8v8L12 21l8.5-5V8L12 3zm0 0v18m8.5-13L12 13 3.5 8'
  },
  {
    number: '03',
    title: 'Создаём',
    description: 'Изготавливаем, бережно доставляем и устанавливаем декор с вниманием к деталям.',
    icon: 'M4 20h16M6 17l3-10h6l3 10M9 7l1-3h4l1 3m-6 5h6'
  }
];

function ArrowIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DecorativeMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 120" fill="none" className="size-full">
      <circle cx="60" cy="60" r="52" stroke="currentColor" strokeWidth=".7" />
      <circle cx="60" cy="60" r="43" stroke="currentColor" strokeWidth=".45" />
      <path d="M31 83V56a29 29 0 0 1 58 0v27M25 83h70M43 83V67h34v16M37 54h46M47 48c0-7 6-13 13-13s13 6 13 13" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="60" cy="53" r="2" fill="currentColor" />
    </svg>
  );
}

export default function Home() {
  const [works, setWorks] = useState<Work[]>(initialWorks);
  const [config, setConfig] = useState<CompanyConfig>(initialConfig);
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeWorks = useMemo(() => works.filter((work) => work.active), [works]);
  const featuredWorks = activeWorks.slice(0, 3);

  useEffect(() => {
    const loadSiteData = async () => {
      try {
        const [worksResponse, configResponse] = await Promise.all([
          fetch('/api/admin/works'),
          fetch('/api/admin/config')
        ]);

        if (worksResponse.ok) {
          const data: Work[] = await worksResponse.json();
          setWorks(data);
        }

        if (configResponse.ok) {
          const data = await configResponse.json() as { company?: CompanyConfig } & Partial<CompanyConfig>;
          setConfig(data.company ?? {
            name: data.name ?? initialConfig.name,
            phone: data.phone ?? initialConfig.phone,
            email: data.email ?? initialConfig.email,
            description: data.description ?? initialConfig.description
          });
        }
      } catch (error) {
        console.error('Error loading site content:', error);
      }
    };

    void loadSiteData();
  }, []);

  const closeLightbox = useCallback(() => setIsOpen(false), []);
  const goToNext = useCallback(
    () => setCurrentIndex((index) => (index + 1) % activeWorks.length),
    [activeWorks.length]
  );
  const goToPrevious = useCallback(
    () => setCurrentIndex((index) => (index - 1 + activeWorks.length) % activeWorks.length),
    [activeWorks.length]
  );

  const openLightbox = (work: Work) => {
    const index = activeWorks.findIndex((item) => item.id === work.id);
    if (index < 0) return;
    setCurrentIndex(index);
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowRight' && activeWorks.length > 1) goToNext();
      if (event.key === 'ArrowLeft' && activeWorks.length > 1) goToPrevious();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeWorks.length, closeLightbox, goToNext, goToPrevious, isOpen]);

  const displayWorkCount = activeWorks.length > 60 ? '60+' : String(activeWorks.length);

  return (
    <div className="site-home">
      <section id="home" className="site-hero relative overflow-hidden">
        <div className="pointer-events-none absolute -left-44 top-24 size-[520px] rounded-full border border-[#d9d0c1]/45" />
        <div className="pointer-events-none absolute -left-28 top-40 size-[360px] rounded-full border border-[#d9d0c1]/35" />
        <div className="site-hero-grid relative mx-auto grid max-w-[1440px] items-center gap-10 px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-14 lg:min-h-[650px] lg:grid-cols-[0.86fr_1.14fr] lg:gap-8 lg:px-12 lg:pb-20 lg:pt-12 xl:min-h-[710px] xl:gap-14">
          <div className="site-hero-copy relative z-10 max-w-[570px] lg:pb-4">
            <div className="mb-7 flex items-center gap-3">
              <span className="site-eyebrow-line h-px w-9 bg-[#a67b4e]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.23em] text-[#927650] sm:text-[11px]">Мастерская лепного декора · Санкт-Петербург</p>
            </div>
            <h1 className="site-hero-title font-cinzel text-[clamp(2.9rem,7.2vw,6.35rem)] font-medium leading-[0.99] tracking-[-0.055em] text-[#292b25]">
              Интерьеры,
              <br />
              <span className="site-hero-title-accent italic text-[#9b7852]">в которых</span>
              <br />
              живёт история.
            </h1>
            <p className="mt-7 max-w-[415px] text-[15px] leading-7 text-[#77756d] sm:text-base">
              Гипсовая лепнина, созданная для вашего пространства. От первого эскиза до последнего штриха.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#calculator" className="site-button-primary inline-flex h-12 items-center gap-3 rounded-full bg-[#292b25] px-6 text-[12px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#45463d] hover:shadow-lg">
                Подобрать декор
                <ArrowIcon />
              </a>
              <a href="#portfolio" className="inline-flex h-12 items-center gap-2 rounded-full border border-[#ddd7cb] px-5 text-[12px] font-medium text-[#55554e] transition-colors hover:border-[#a88b67] hover:bg-white/60">
                Смотреть проекты
              </a>
            </div>

            <div className="mt-12 flex items-center gap-7 border-t border-[#e5ded2] pt-6 sm:gap-10">
              <div>
                <p className="font-cinzel text-2xl tracking-[-0.04em] text-[#33342e]">15<span className="ml-1 text-base text-[#9b7852]">лет</span></p>
                <p className="mt-1 text-[10px] text-[#89877f]">создаём детали</p>
              </div>
              <span className="h-9 w-px bg-[#ded7ca]" />
              <div>
                <p className="font-cinzel text-2xl tracking-[-0.04em] text-[#33342e]">{displayWorkCount}<span className="ml-1 text-base text-[#9b7852]">+</span></p>
                <p className="mt-1 text-[10px] text-[#89877f]">готовых проектов</p>
              </div>
              <span className="h-9 w-px bg-[#ded7ca]" />
              <div>
                <p className="font-cinzel text-2xl tracking-[-0.04em] text-[#33342e]">100%</p>
                <p className="mt-1 text-[10px] text-[#89877f]">ручной подход</p>
              </div>
            </div>
          </div>

          <div className="site-hero-visual relative mx-auto w-full max-w-[700px] lg:ml-auto">
            <div className="site-hero-image-frame relative ml-auto h-[390px] w-[91%] overflow-hidden rounded-t-[48%] rounded-b-[10px] bg-[#ded6c9] sm:h-[500px] lg:h-[560px] xl:h-[610px]">
              <Image
                src="/1.jpg"
                alt="Тонкая лепнина и гипсовый декор в классическом интерьере"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 58vw"
                className="site-hero-image object-cover object-[50%_46%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#171713]/40 via-transparent to-[#171713]/5" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-white sm:p-7">
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-white/75">Красота — в деталях</p>
                  <p className="mt-1.5 font-cinzel text-lg tracking-[0.025em]">Традиции формы</p>
                </div>
                <span className="font-cinzel text-xs tracking-[0.16em] text-white/70">01 / 03</span>
              </div>
            </div>
            <div className="site-hero-image-back absolute bottom-[7%] left-0 -z-10 h-[66%] w-[38%] rounded-t-[46%] rounded-b-[7px] border border-[#bca47f]/60" />
            <div className="site-hero-seal absolute -left-2 top-[13%] flex size-[92px] items-center justify-center rounded-full bg-[#f7f5f0] p-2 text-[#a48966] shadow-[0_8px_28px_rgba(54,48,37,0.12)] sm:left-0 sm:size-[112px] sm:p-3">
              <DecorativeMark />
            </div>
            <div className="site-hero-caption absolute -bottom-5 left-[3%] rounded-xl border border-white/80 bg-white/90 px-4 py-3 shadow-[0_8px_30px_rgba(46,41,31,0.09)] backdrop-blur-md sm:bottom-5 sm:left-[-5%] sm:px-5 sm:py-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-[#a0815c]">Искусство гипса</p>
              <p className="mt-1 text-xs font-medium text-[#3d3d36] sm:text-sm">Создано на века</p>
            </div>
            <span className="site-hero-vertical absolute right-[-16px] top-[35%] hidden [writing-mode:vertical-rl] text-[9px] font-medium uppercase tracking-[0.2em] text-[#8e897e] xl:block">
              ЭСТЕТИКА · МАСТЕРСТВО · ВРЕМЯ
            </span>
          </div>
        </div>
        <div className="site-hero-bottom mx-auto flex max-w-[1440px] items-center justify-between border-t border-[#e7e1d7] px-5 py-4 sm:px-8 lg:px-12">
          <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-[#98958b]">Лепной декор ручной работы</p>
          <a href="#portfolio" className="flex items-center gap-2 text-[10px] font-medium text-[#77756d] transition-colors hover:text-[#927650]">
            Листайте, чтобы вдохновиться
            <span className="site-scroll-arrow text-sm">↓</span>
          </a>
        </div>
      </section>

      <section className="site-intro-band border-b border-[#e8e2d8] bg-[#eeebe4]">
        <div className="mx-auto grid max-w-[1440px] gap-5 px-5 py-6 sm:grid-cols-3 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 sm:justify-center sm:border-r sm:border-[#d9d2c7]">
            <span className="flex size-8 items-center justify-center rounded-full bg-white/70 text-[#977956]">
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4"><path d="m10 2 2.2 5.2L18 10l-5.8 2.8L10 18l-2.2-5.2L2 10l5.8-2.8L10 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>
            </span>
            <span className="text-xs font-medium text-[#59584f]">Индивидуальный подбор</span>
          </div>
          <div className="flex items-center gap-3 sm:justify-center sm:border-r sm:border-[#d9d2c7]">
            <span className="flex size-8 items-center justify-center rounded-full bg-white/70 text-[#977956]">
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4"><path d="M10 2.5 16 5v4.7c0 3.4-2.3 6.4-6 7.8-3.7-1.4-6-4.4-6-7.8V5l6-2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /><path d="m7.5 9.8 1.7 1.7 3.5-3.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <span className="text-xs font-medium text-[#59584f]">Проверенные материалы</span>
          </div>
          <div className="flex items-center gap-3 sm:justify-center">
            <span className="flex size-8 items-center justify-center rounded-full bg-white/70 text-[#977956]">
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4"><path d="M3 16.5h14M5 14V8l5-3 5 3v6M8 14v-3h4v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <span className="text-xs font-medium text-[#59584f]">Замер и монтаж</span>
          </div>
        </div>
      </section>

      <section id="portfolio" className="site-portfolio-section scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1440px]">
          <div className="site-section-heading mb-11 flex flex-col gap-5 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-[620px]">
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-8 bg-[#a67b4e]" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#927650]">Воплощённые идеи</p>
              </div>
              <h2 className="font-cinzel text-4xl font-medium leading-[1.08] tracking-[-0.04em] text-[#292b25] sm:text-5xl lg:text-6xl">
                Форма. Свет.
                <br className="hidden sm:block" /> Характер.
              </h2>
            </div>
            <div className="flex flex-col gap-4 sm:max-w-[350px] sm:items-end sm:text-right">
              <p className="text-sm leading-6 text-[#77756d]">
                Каждый орнамент становится частью пространства. Посмотрите, как классическая лепнина звучит в современных интерьерах.
              </p>
              <Link href="/portfolio" className="inline-flex items-center gap-2 self-start text-xs font-semibold text-[#514f47] transition-colors hover:text-[#927650] sm:self-end">
                Все проекты
                <ArrowIcon className="size-3.5" />
              </Link>
            </div>
          </div>

          {featuredWorks.length === 0 ? (
            <p className="rounded-2xl border border-[#e7e1d7] bg-white/70 px-6 py-14 text-center text-sm text-[#77756d]">Скоро здесь появятся новые проекты.</p>
          ) : (
            <div className="site-project-grid grid gap-5 md:grid-cols-2 lg:grid-cols-12 lg:gap-6">
              {featuredWorks.map((work, index) => (
                <button
                  type="button"
                  key={work.id}
                  onClick={() => openLightbox(work)}
                  aria-label={`Открыть фотографию проекта: ${work.title}`}
                  className={`site-project-card group relative block w-full overflow-hidden rounded-2xl bg-[#e6e1d8] text-left ${
                    index === 0 ? 'h-[340px] sm:h-[440px] lg:col-span-7 lg:h-[520px]' :
                    index === 1 ? 'h-[340px] sm:h-[440px] lg:col-span-5 lg:mt-16 lg:h-[390px]' :
                    'h-[340px] sm:h-[420px] lg:col-span-5 lg:-mt-20 lg:h-[390px]'
                  }`}
                >
                  <Image
                    src={work.src}
                    alt={work.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 58vw"
                    className="site-project-image object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                    priority={index === 0}
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-[#181914]/65 via-[#181914]/5 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
                  <span className="absolute left-5 top-5 rounded-full border border-white/30 bg-[#22231e]/25 px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.15em] text-white backdrop-blur-md">
                    Проект {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-7">
                    <span>
                      <span className="block text-[9px] font-medium uppercase tracking-[0.17em] text-white/65">Гипсовая лепнина</span>
                      <span className="mt-2 block font-cinzel text-xl tracking-[0.015em] text-white sm:text-2xl">{work.title}</span>
                    </span>
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/45 text-white transition-all group-hover:border-white group-hover:bg-white group-hover:text-[#292b25]">
                      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4">
                        <path d="M7 3H3v4m10-4h4v4M3 13v4h4m10-4v4h-4M7 7l-4-4m10 4 4-4M7 13l-4 4m10-4 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="site-portfolio-footer mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#e5ded2] pt-5">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#969287]">От эскиза до завершённого интерьера</p>
            <Link href="/portfolio" className="inline-flex items-center gap-2 rounded-full border border-[#ded7cb] px-4 py-2.5 text-[11px] font-medium text-[#55554e] transition-colors hover:border-[#b8a17e] hover:bg-white/70">
              Смотреть галерею
              <ArrowIcon className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section id="process" className="site-process-section scroll-mt-24 border-y border-[#e7e1d7] bg-[#eeebe4] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="site-process-heading mb-12 grid gap-5 lg:mb-16 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-8 bg-[#a67b4e]" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#927650]">Продумано до мелочей</p>
              </div>
              <h2 className="font-cinzel text-3xl font-medium leading-tight tracking-[-0.035em] text-[#292b25] sm:text-4xl lg:text-5xl">От первого штриха — до вашего дома.</h2>
            </div>
            <p className="max-w-[330px] text-sm leading-6 text-[#77756d] lg:pb-1">
              Красивый результат начинается с внимания. Мы рядом на каждом этапе.
            </p>
          </div>

          <div className="site-process-grid grid gap-3 md:grid-cols-3">
            {processSteps.map((step) => (
              <article key={step.number} className="site-process-card group relative min-h-[220px] overflow-hidden rounded-2xl border border-[#e1dbd0] bg-[#f7f5f0]/80 p-6 transition-colors hover:bg-white sm:p-8">
                <span className="absolute right-6 top-5 font-cinzel text-[48px] leading-none tracking-[-0.06em] text-[#e4ded2] transition-colors group-hover:text-[#d4c7b4]">{step.number}</span>
                <span className="flex size-11 items-center justify-center rounded-xl bg-white text-[#96734d] shadow-[0_2px_8px_rgba(48,43,33,0.05)]">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
                    <path d={step.icon} stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <h3 className="mt-8 font-cinzel text-xl font-medium tracking-[-0.025em] text-[#34352f]">{step.title}</h3>
                <p className="mt-2 max-w-[320px] text-[13px] leading-6 text-[#77756d]">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="calculator" className="site-calculator-section scroll-mt-24 px-4 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1280px]">
          <div className="site-calculator-heading mb-10 grid gap-5 sm:mb-12 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-8 bg-[#a67b4e]" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#927650]">Продумайте свой интерьер</p>
              </div>
              <h2 className="font-cinzel text-3xl font-medium tracking-[-0.04em] text-[#292b25] sm:text-4xl lg:text-5xl">Найдите свои детали.</h2>
            </div>
            <p className="max-w-[360px] text-sm leading-6 text-[#77756d]">
              Выберите изделия, настройте расчёт и отправьте нам заявку — поможем довести её до идеального проекта.
            </p>
          </div>
          <div className="site-calculator-panel rounded-[24px] border border-[#e4ded3] bg-[#eeebe4] p-2 shadow-[0_24px_70px_rgba(55,49,38,0.07)] sm:p-4 lg:p-5">
            <OrderForm />
          </div>
        </div>
      </section>

      <section id="contacts" className="site-contact-section scroll-mt-24 px-5 pb-20 sm:px-8 sm:pb-24 lg:px-12 lg:pb-28">
        <div className="site-contact-card relative mx-auto max-w-[1440px] overflow-hidden rounded-[26px] bg-[#282a24] px-6 py-12 text-white sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <div className="pointer-events-none absolute -right-16 -top-56 size-[540px] rounded-full border border-white/[0.09]" />
          <div className="pointer-events-none absolute -right-2 -top-40 size-[410px] rounded-full border border-white/[0.08]" />
          <div className="pointer-events-none absolute bottom-[-260px] right-[22%] size-[460px] rounded-full border border-white/[0.07]" />
          <div className="site-contact-content relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-[680px]">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-8 bg-[#c4a780]" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c4a780]">Начнём с разговора</p>
              </div>
              <h2 className="font-cinzel text-4xl font-medium leading-[1.1] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                В вашем доме
                <br /><span className="italic text-[#c4a780]">тоже будет история.</span>
              </h2>
              <p className="mt-5 max-w-[430px] text-sm leading-6 text-white/55">
                Расскажите, что задумали. Подберём декор, ответим на вопросы и рассчитаем стоимость.
              </p>
              <a href={`tel:${config.phone.replace(/[^\d+]/g, '')}`} className="site-contact-cta mt-8 inline-flex h-12 items-center gap-3 rounded-full bg-[#f5f2eb] px-6 text-[12px] font-semibold text-[#292b25] transition-all hover:-translate-y-0.5 hover:bg-white">
                Позвонить нам
                <ArrowIcon />
              </a>
            </div>
            <div className="site-contact-details flex flex-col gap-5 border-t border-white/15 pt-5 lg:min-w-[280px] lg:border-l lg:border-t-0 lg:pb-1 lg:pl-8 lg:pt-0">
              <div>
                <p className="text-[9px] font-medium uppercase tracking-[0.17em] text-white/45">Телефон</p>
                <a href={`tel:${config.phone.replace(/[^\d+]/g, '')}`} className="mt-2 block text-lg font-medium tracking-[-0.02em] text-white transition-colors hover:text-[#d4b68f]">{config.phone}</a>
              </div>
              <div>
                <p className="text-[9px] font-medium uppercase tracking-[0.17em] text-white/45">Почта</p>
                <a href={`mailto:${config.email}`} className="mt-2 block text-sm text-white/80 transition-colors hover:text-[#d4b68f]">{config.email}</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isOpen && activeWorks[currentIndex] && (
        <div
          className="site-lightbox fixed inset-0 z-[60] flex items-center justify-center bg-[#171813]/95 p-4 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`Просмотр фотографии: ${activeWorks[currentIndex].title}`}
          onClick={closeLightbox}
        >
          <button type="button" onClick={closeLightbox} aria-label="Закрыть галерею" className="absolute right-5 top-5 z-10 flex size-11 items-center justify-center rounded-full border border-white/20 text-2xl text-white transition-colors hover:bg-white/10">
            ×
          </button>
          {activeWorks.length > 1 && (
            <>
              <button type="button" onClick={(event) => { event.stopPropagation(); goToPrevious(); }} aria-label="Предыдущая фотография" className="absolute left-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 text-2xl text-white transition-colors hover:bg-white/10 sm:left-7">
                ‹
              </button>
              <button type="button" onClick={(event) => { event.stopPropagation(); goToNext(); }} aria-label="Следующая фотография" className="absolute right-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 text-2xl text-white transition-colors hover:bg-white/10 sm:right-7">
                ›
              </button>
            </>
          )}
          <div className="relative h-full max-h-[86vh] w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <Image src={activeWorks[currentIndex].src} alt={activeWorks[currentIndex].title} fill sizes="100vw" className="object-contain" priority />
            <p className="absolute inset-x-0 -bottom-8 text-center text-[11px] text-white/65">
              {activeWorks[currentIndex].title} · {currentIndex + 1} / {activeWorks.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
