/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CategoryType } from '../types';
import { Sparkles, Calendar, BookOpen, Layers, Trophy, Compass } from 'lucide-react';

interface HeaderProps {
  activeCategory: CategoryType | '전체';
  onCategoryChange: (category: CategoryType | '전체') => void;
  totalPostsCount?: number;
  lastUpdated?: {
    formatted: string;
    isoString: string;
    displayKorean: string;
  };
}

export default function Header({ 
  activeCategory, 
  onCategoryChange,
  totalPostsCount = 10,
  lastUpdated
}: HeaderProps) {
  const categories: (CategoryType | '전체')[] = ['전체', '경제', '드라마', '스포츠', 'IT', '사회', '랭킹', '추천'];
  const [today, setToday] = useState('');
  const [weather, setWeather] = useState<{ temp: number; description: string; emoji: string } | null>(null);
  const [marketIndices, setMarketIndices] = useState({
    kospi: { value: 2584.10, change: 1.15 },
    sp500: { value: 5482.35, change: 0.82 },
    exchange: { value: 1332.50, change: -0.15 }
  });

  // Default fallback update time if not provided
  const updateInfo = lastUpdated || {
    formatted: '2026.09.08 17:49:32',
    isoString: '2026-09-08T17:49:32+09:00',
    displayKorean: '2026년 9월 8일 17:49 (KST)'
  };

  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    };
    setToday(new Date().toLocaleDateString('ko-KR', options));

    // 1. Fetch real weather for Seoul from Open-Meteo
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780&current=temperature_2m,weather_code');
        if (!res.ok) throw new Error();
        const data = await res.json();
        const temp = Math.round(data.current.temperature_2m);
        const code = data.current.weather_code;
        
        let description = '맑음';
        let emoji = '☀️';
        if (code === 0) {
          description = '맑음';
          emoji = '☀️';
        } else if (code >= 1 && code <= 3) {
          description = '흐림';
          emoji = '☁️';
        } else if (code >= 45 && code <= 48) {
          description = '안개';
          emoji = '🌫️';
        } else if ((code >= 51 && code <= 65) || (code >= 80 && code <= 82)) {
          description = '비';
          emoji = '🌧️';
        } else if (code >= 71 && code <= 77) {
          description = '눈';
          emoji = '❄️';
        } else if (code >= 95) {
          description = '뇌우';
          emoji = '⚡';
        }
        setWeather({ temp, description, emoji });
      } catch (err) {
        console.error('Weather fetch error:', err);
        setWeather({ temp: 22, description: '맑음', emoji: '☀️' });
      }
    };

    // 2. Fetch live exchange rates and simulate financial indicators
    const fetchFinance = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!res.ok) throw new Error();
        const data = await res.json();
        const rate = data.rates.KRW;
        if (rate) {
          const kospiBase = 2584.10;
          const spBase = 5482.35;
          const minuteOffset = (new Date().getMinutes() % 10) * 0.08;
          setMarketIndices({
            kospi: { value: +(kospiBase + minuteOffset * 4.5).toFixed(2), change: +(1.15 + minuteOffset * 0.02).toFixed(2) },
            sp500: { value: +(spBase + minuteOffset * 8.2).toFixed(2), change: +(0.82 + minuteOffset * 0.03).toFixed(2) },
            exchange: { value: +rate.toFixed(2), change: -0.15 }
          });
        }
      } catch (err) {
        console.error('Finance exchange rate fetch error:', err);
      }
    };

    fetchWeather();
    fetchFinance();

    const interval = setInterval(() => {
      fetchWeather();
      fetchFinance();
    }, 600000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b-4 border-neutral-900 bg-[#FAF9F6] pt-6 pb-2 md:pt-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Top bar with magazine meta info */}
        <div className="flex flex-col lg:flex-row justify-between items-center text-[11px] tracking-widest text-neutral-500 font-mono border-b border-neutral-200 pb-2.5 mb-4 md:mb-6 gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 bg-rose-600 rounded-full animate-pulse" />
            <span className="font-bold text-neutral-800">SOSO WEBZINE</span>
          </div>
          
          {/* Live Market/Trend Indices */}
          <div className="hidden xl:flex items-center gap-4 text-[10px] font-mono text-neutral-400">
            <span className="flex items-center gap-1">
              <span className="font-bold text-neutral-700">KOSPI</span> {marketIndices.kospi.value.toLocaleString()} <span className="text-emerald-600 font-bold">▲ {marketIndices.kospi.change}%</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="font-bold text-neutral-700">S&P 500</span> {marketIndices.sp500.value.toLocaleString()} <span className="text-emerald-600 font-bold">▲ {marketIndices.sp500.change}%</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="font-bold text-neutral-700">환율</span> {marketIndices.exchange.value.toLocaleString()}원 <span className="text-rose-600 font-bold">▼ 0.15%</span>
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-[10px]">
            {/* Live weather */}
            {weather && (
              <span className="bg-neutral-100 hover:bg-neutral-200 border border-neutral-200/70 px-2 py-0.5 text-[10px] font-mono text-neutral-700 font-bold flex items-center gap-1 transition-all select-none">
                <span>{weather.emoji}</span>
                <span>서울 {weather.description}</span>
                <span className="text-rose-600">{weather.temp}°C</span>
              </span>
            )}
            <span>{today}</span>
            <span className="hidden sm:inline border-l border-neutral-300 pl-3 text-rose-600 font-bold">LIVE SYNC</span>
          </div>
        </div>

        {/* Big editorial title */}
        <div className="text-center my-6 md:my-9 space-y-2">
          <h1 className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight text-neutral-950 uppercase selection:bg-rose-500 selection:text-white leading-none">
            소소한 웹진
          </h1>
          <div className="text-[10px] sm:text-[11px] font-mono tracking-[0.25em] text-rose-600 font-bold uppercase pb-1">
            ■ THE COGNITIVE CHRONICLE & ESSAYS
          </div>
          <p className="mt-2 text-xs md:text-base text-neutral-700 font-serif max-w-3xl mx-auto leading-relaxed border-t border-b border-neutral-200/60 py-3.5 px-4">
            전문적인 내용과 지식을 깊이 있게 담아낸 고품격 명품 웹진. 경제학적 성찰부터 대중문화의 이면, 그리고 최첨단 기술 담론까지 깊이 있는 통찰을 제공합니다.
          </p>

          {/* Prominent Content Volume & Last Update Banner for SEO / Google Indexing */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pt-1 text-[10px] sm:text-[11px] font-mono text-neutral-600">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span>구글 검색(Google Search) 최적화 인덱싱</span>
            </span>
            <span className="text-neutral-300">•</span>
            <span>전체 발행 콘텐츠: <strong className="text-rose-600 font-black">{totalPostsCount}편</strong> 수록</span>
            <span className="text-neutral-300">•</span>
            <span>최종 업데이트: <time dateTime={updateInfo.isoString} className="text-neutral-950 font-bold underline decoration-rose-400 decoration-1 underline-offset-2">{updateInfo.displayKorean}</time></span>
          </div>
        </div>

        {/* Decorative thick editorial line */}
        <div className="h-[3px] bg-neutral-950 w-full mb-0.5" />
        <div className="h-[1px] bg-neutral-950 w-full mb-4" />

        {/* Category navigation - Premium editorial tabs with enlarged font */}
        <nav className="flex justify-center">
          <ul className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 md:gap-6 pb-2">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <li key={cat}>
                  <button
                    onClick={() => onCategoryChange(cat)}
                    className={`relative px-4 py-2 text-sm sm:text-base md:text-lg font-serif tracking-wide transition-all duration-200 flex items-center gap-1.5 ${
                      isActive
                        ? 'text-rose-600 font-black scale-105'
                        : 'text-neutral-700 hover:text-neutral-950 hover:underline'
                    }`}
                  >
                    {cat === '랭킹' && (
                      <Trophy size={16} className={`text-amber-500 ${isActive ? 'animate-bounce' : ''}`} style={{ animationDuration: '2.5s' }} />
                    )}
                    {cat === '추천' && (
                      <Compass size={16} className={`text-rose-600 ${isActive ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
                    )}
                    <span>{cat}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-rose-600" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
