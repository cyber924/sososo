/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import PostCard from './components/PostCard';
import PostDetail from './components/PostDetail';
import ImageGuard from './components/ImageGuard';
import { Post, CategoryType } from './types';
import { 
  Database, 
  Sparkles, 
  Search, 
  Plus, 
  Check, 
  FileText, 
  BookOpen, 
  Send, 
  Hash, 
  HelpCircle,
  Code,
  RefreshCw,
  Shuffle,
  ArrowLeft
} from 'lucide-react';

declare global {
  interface Window {
    __INITIAL_POST__?: Post | null;
    __INITIAL_POSTS__?: Post[];
    __INITIAL_POST_NOT_FOUND__?: boolean;
    __INITIAL_SITE_URL__?: string;
  }
}

export default function App() {
  const [posts, setPosts] = useState<Post[]>(() => window.__INITIAL_POSTS__ || []);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryType | '전체'>('전체');
  const [searchQuery, setSearchQuery] = useState('');

  // Initial SSR state hydration for /blog/:id
  const [selectedPost, setSelectedPost] = useState<Post | null>(() => {
    if (typeof window !== 'undefined' && window.__INITIAL_POST__) {
      return window.__INITIAL_POST__;
    }
    return null;
  });

  const [isPostNotFound, setIsPostNotFound] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.__INITIAL_POST_NOT_FOUND__) {
      return true;
    }
    return false;
  });

  // Recommended landmark portals with sub-filters and professional verdicts
  const recommendedPortals = useMemo(() => [
    {
      id: 'gemini',
      name: 'Google Gemini',
      url: 'https://gemini.google.com',
      category: 'AI',
      badge: 'GENERATIVE AI',
      description: '구글이 개발한 차세대 멀티모달 초거대 인공지능. 지메일, 구글 문서 등 구글 에코시스템과의 뛰어난 연동성과 심층 정보 리서치에 최적화되어 있습니다.',
      verdict: '구글 생태계와의 완벽한 융합 및 실시간 웹 검색 기반 통찰에 가장 추천',
      color: 'border-l-indigo-600',
      tag: '구글 AI',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50/50'
    },
    {
      id: 'chatgpt',
      name: 'OpenAI ChatGPT',
      url: 'https://chatgpt.com',
      category: 'AI',
      badge: 'GENERATIVE AI',
      description: '인공지능 대중화 시대를 개방한 OpenAI의 독보적인 대화형 서비스. 다채로운 GPTs 플러그인 생태계와 코딩 작성 및 텍스트 창작 업무 등 다재다능한 종합 비서 역할을 수행합니다.',
      verdict: '독창적인 텍스트 창작, 코딩 자동화 및 멀티턴 업무 지시에 가장 강력한 조력자',
      color: 'border-l-teal-600',
      tag: '대형 언어모델',
      textColor: 'text-teal-700',
      bgColor: 'bg-teal-50/50'
    },
    {
      id: 'claude',
      name: 'Anthropic Claude',
      url: 'https://claude.ai',
      category: 'AI',
      badge: 'GENERATIVE AI',
      description: 'Anthropic이 구축한 극상의 맥락 이해력을 자랑하는 언어 모델. 꼼꼼한 어휘 선택, 긴 학술 문서 요약, 그리고 미려하고 자연스러운 한국어 에세이 번역/문체 표현에 최강의 강세를 보입니다.',
      verdict: '대용량 텍스트 분석, 고차원 영문 번역 및 긴 호흡의 기획안 작성용 원탑 도구',
      color: 'border-l-amber-600',
      tag: '독보적 필력',
      textColor: 'text-amber-800',
      bgColor: 'bg-amber-50/50'
    },
    {
      id: 'perplexity',
      name: 'Perplexity AI 퍼플렉시티',
      url: 'https://www.perplexity.ai',
      category: 'AI',
      badge: 'AI SEARCH ENGINE',
      description: '실시간 검색과 거대 인공지능을 결합한 지능형 답변 엔진. 질문의 맥락을 파악하고 최신 웹 문서를 실시간 추적하여 완벽한 신뢰성 출처 주석과 요약을 제공합니다.',
      verdict: '최신 동향 탐색, 팩트 기반 학술 리서치 및 참고 자료 출처 검증의 절대 강자',
      color: 'border-l-teal-500',
      tag: '대화형 검색',
      textColor: 'text-teal-700',
      bgColor: 'bg-teal-50/50'
    },
    {
      id: 'deepl',
      name: 'DeepL 번역기',
      url: 'https://www.deepl.com',
      category: 'AI',
      badge: 'AI TRANSLATION',
      description: '전 세계 전문 번역가들이 극찬하는 독보적인 인공신경망 번역 엔진. 단순 직역의 어색함을 완벽히 탈피해 자연스러운 현지 관용구와 비즈니스 어휘 뉘앙스를 반영합니다.',
      verdict: '학술 논문, 공식 비즈니스 계약서 및 외신 번역 시 현존 최고의 정교함',
      color: 'border-l-cyan-600',
      tag: '초정밀 번역',
      textColor: 'text-cyan-700',
      bgColor: 'bg-cyan-50/50'
    },
    {
      id: 'v0',
      name: 'v0 by Vercel',
      url: 'https://v0.dev',
      category: 'AI',
      badge: 'GEN-UI PLATFORM',
      description: 'Vercel에서 만든 프론트엔드 코드 생성 AI 플랫폼. 한 줄의 기획 문장이나 요구사항 프롬프트를 입력하면 실시간으로 반응형 Tailwind/React 웹 요소를 빌드해 줍니다.',
      verdict: '개발 생산성의 미래, 10초 만에 완벽한 UI 레이아웃 초안 및 코드를 수급할 때 필수',
      color: 'border-l-neutral-800',
      tag: 'UI 제너레이터',
      textColor: 'text-neutral-800',
      bgColor: 'bg-neutral-100'
    },
    {
      id: 'naver',
      name: 'Naver 네이버',
      url: 'https://www.naver.com',
      category: '포털',
      badge: 'PORTAL SEARCH',
      description: '대한민국 국민들의 일상 깊숙이 자리 잡은 부동의 1위 검색 포털. 국내 지리 정보, 실시간 쇼핑 최저가 비교, 카페/블로그 커뮤니티 데이터베이스 검색 및 생활밀착형 소식을 가장 빠르게 전달합니다.',
      verdict: '국내 위치 기반 소식, 실시간 대중 동향 파악 및 블로그/카페 리뷰 탐색 시 절대 필수',
      color: 'border-l-emerald-500',
      tag: '국민 포털',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50/50'
    },
    {
      id: 'google',
      name: 'Google 구글',
      url: 'https://www.google.com',
      category: '포털',
      badge: 'GLOBAL ENGINE',
      description: '전 세계 인터넷 검색 트래픽의 90% 이상을 주도하는 글로벌 표준 검색 엔진. 철저하게 정보의 가치와 오리지널리티를 중시하는 페이지랭크 알고리즘을 통해 신뢰도 높은 기술 문서와 원천 자료를 선별해 줍니다.',
      verdict: '글로벌 오픈소스 기술 서적, 공식 학술 문서 및 전문 원천 데이터베이스 서칭에 절대적 존재',
      color: 'border-l-blue-500',
      tag: '지식의 요람',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50/50'
    },
    {
      id: 'daum',
      name: 'Daum 다음',
      url: 'https://www.daum.net',
      category: '포털',
      badge: 'PORTAL & MEDIA',
      description: '카카오 그룹의 유기적 플랫폼이자 친숙한 미디어 대표 포털. 정돈된 시사 칼럼, 유저 밀착형 연예 뉴스 큐레이션 및 오랜 역사와 깊이를 지닌 티스토리 블로그 정보 아카이브를 지원합니다.',
      verdict: '한눈에 정돈되는 실시간 국내 주요 뉴스 편집 지면 및 커뮤니티 트렌드 모니터링',
      color: 'border-l-yellow-400',
      tag: '뉴스&블로그',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50/50'
    },
    {
      id: 'bing',
      name: 'Microsoft Bing 빙',
      url: 'https://www.bing.com',
      category: '포털',
      badge: 'AI POWERED PORTAL',
      description: '마이크로소프트의 공식 인공지능 통합 검색 허브. 코파일럿(Copilot)과의 적극적인 공조 체제를 구성하여 유저는 복잡한 검색 키워드 대신 자연어로 답변을 도출할 수 있습니다.',
      verdict: '윈도우 에코시스템 통합 제어, 코파일럿 연계 정보 습득 및 고화질 이미지 검색 강세',
      color: 'border-l-blue-600',
      tag: '코파일럿 연동',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50/50'
    },
    {
      id: 'wikipedia',
      name: 'Wikipedia 위키백과',
      url: 'https://ko.wikipedia.org',
      category: '포털',
      badge: 'OPEN ENCYCLOPEDIA',
      description: '전 인류의 지적 자산을 집대성하는 온라인 백과사전. 역사, 인물, 기술, 대중문화 전 분야에 거쳐 철저한 상호 검증과 출처에 기인한 원천적인 팩트 사전을 아카이빙합니다.',
      verdict: '새로운 개념의 근원적 사전 정의, 개념의 역사적 계보 및 상호교차 사실 확인의 최우선 입문지',
      color: 'border-l-neutral-400',
      tag: '지식 아카이브',
      textColor: 'text-neutral-600',
      bgColor: 'bg-neutral-50/50'
    },
    {
      id: 'coupang',
      name: 'Coupang 쿠팡',
      url: 'https://www.coupang.com',
      category: '쇼핑',
      badge: 'E-COMMERCE',
      description: '대한민국 유통 지형을 혁신한 독보적인 커머스 강자. 로켓배송과 로켓프레시를 바탕으로 주문한 몇 시간 뒤에 문 앞에 생필품을 즉시 공수하는 압도적인 일상 편의 네트워크를 선물합니다.',
      verdict: '소모품 및 식재료를 당일 또는 내일 아침 새벽까지 즉시 수령해야 할 때의 압도적 편리함',
      color: 'border-l-orange-500',
      tag: '로켓 배송',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50/50'
    },
    {
      id: 'gmarket',
      name: 'Gmarket 지마켓',
      url: 'https://www.gmarket.co.kr',
      category: '쇼핑',
      badge: 'MARKETPLACE',
      description: '대형 오픈마켓의 역사와 저력을 대변하는 신세계 산하의 쇼핑 허브. 다채로운 스마일배송 쿠폰과 정기 빅세일 이벤트를 통해 종합 가전, 의류 등 브랜드 정품 구매 시 최고의 할인 시너지를 제공합니다.',
      verdict: '브랜드 종합 가전 및 생활용품 기획전 할인, 스마일클럽 제휴 시 시너지 최적',
      color: 'border-l-sky-500',
      tag: '빅세일 명가',
      textColor: 'text-sky-600',
      bgColor: 'bg-sky-50/50'
    },
    {
      id: 'ssg',
      name: 'SSG.COM 쓱닷컴',
      url: 'https://www.ssg.com',
      category: '쇼핑',
      badge: 'PREMIUM SHOPPING',
      description: '신세계와 이마트의 역량을 한 데 모은 하이엔드 라이프스타일 포털. 검증된 신선식품 새벽배송과 신세계 백화점의 명품 입점 브랜드 정품 보장 딜을 동시에 충족시킵니다.',
      verdict: '식재료의 뛰어난 신선도 신뢰, 대형마트 주간 장보기 및 럭셔리 뷰티/패션 정품 안심 소비',
      color: 'border-l-amber-500',
      tag: '신세계 정품',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50/50'
    },
    {
      id: 'musinsa',
      name: 'Musinsa 무신사',
      url: 'https://www.musinsa.com',
      category: '쇼핑',
      badge: 'FASHION PORTAL',
      description: '대한민국 청년층의 패션 스타일과 도메스틱 디자이너 트렌드를 결정하는 1위 패션몰. 방대한 유저 착샷 후기와 코디 기획전을 통해 최첨단의 스트리트 라이프스타일을 추천합니다.',
      verdict: '가장 트렌디한 도메스틱 디자이너 의류 서칭, 유저 리얼 타임 착용 후기 비교의 메카',
      color: 'border-l-black',
      tag: '패션 메카',
      textColor: 'text-neutral-950',
      bgColor: 'bg-neutral-50'
    },
    {
      id: 'aliexpress',
      name: 'AliExpress 알리익스프레스',
      url: 'https://best.aliexpress.com',
      category: '쇼핑',
      badge: 'GLOBAL OUTLET',
      description: '전 세계 공급망을 다이렉트로 이끄는 초저가 글로벌 해외 직구 허브. 전자기기 충전 케이블, 모바일 액세서리, 키덜트 부품부터 실용적인 리빙 소품까지 믿을 수 없는 산지 도매가로 조달합니다.',
      verdict: '급하게 필요하지 않은 소형 전자 부품, 모바일 액세서리, 하드웨어 소모품 극강의 최저가 직구',
      color: 'border-l-orange-600',
      tag: '초저가 직구',
      textColor: 'text-orange-700',
      bgColor: 'bg-orange-50/50'
    },
    {
      id: 'youtube',
      name: 'YouTube 유튜브',
      url: 'https://www.youtube.com',
      category: '미디어',
      badge: 'VIDEO CULTURE',
      description: '글로벌 최대 규모의 동영상 라이브러리이자 현대 교양 교육의 요람. 단순 킬링타임 예능뿐만 아니라 글로벌 대학 콘퍼런스, 테크 튜토리얼, 지식 교양 다큐멘터리까지 살아 숨 쉬는 전 세계의 비디오 지식이 총집합해 있습니다.',
      verdict: '세계 최고 석학의 강연 감상, 실시간 시각 가이드 및 트렌드 영상 지식 탐색의 심장',
      color: 'border-l-red-600',
      tag: '지식 엔터테인먼트',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50/50'
    },
    {
      id: 'netflix',
      name: 'Netflix 넷플릭스',
      url: 'https://www.netflix.com',
      category: '미디어',
      badge: 'GLOBAL OTT NO.1',
      description: '구독형 온라인 스트리밍 시장을 개척한 명실상부한 No.1 오리지널 엔터테인먼트 플랫폼. 영화관 수준의 메가히트 글로벌 시리즈물, 정교한 다큐멘터리 및 풍성한 시네마 라이브러리를 자랑합니다.',
      verdict: '주말 저녁을 위한 명작 글로벌 시리즈 몰입 및 초고화질 다큐 아카이브 큐레이션 원탑',
      color: 'border-l-red-700',
      tag: '시네마 아카이브',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50/50'
    },
    {
      id: 'chzzk',
      name: 'Naver Chzzk 치지직',
      url: 'https://chzzk.naver.com',
      category: '미디어',
      badge: 'LIVE STREAMING',
      description: '네이버가 론칭한 대한민국 차세대 라이브 스트리밍 플랫폼. 초고화질 방송 인프라와 친숙한 네이버페이 후원 생태계를 결합하여 크리에이터와 대중이 실시간 소통하는 공간입니다.',
      verdict: '국내 서브컬처, 실시간 게임 소통 및 크리에이터의 생생한 라이브 방송 감상용',
      color: 'border-l-green-400',
      tag: '네이버 라이브',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50/50'
    },
    {
      id: 'spotify',
      name: 'Spotify 스포티파이',
      url: 'https://www.spotify.com',
      category: '미디어',
      badge: 'AUDIO BRAND NO.1',
      description: '음악 애호가들을 전율케 한 극강의 맞춤형 플레이리스트 알고리즘. 나의 미세한 취향 변화와 분위기에 딱 맞춘 음악 발굴 능력 및 글로벌 유익한 오디오 팟캐스트 아카이브를 선사합니다.',
      verdict: '기분과 날씨, 감정선에 귀신같이 대응하는 고감도 뮤직 플레이리스트 디스커버리',
      color: 'border-l-emerald-600',
      tag: '음악 추천',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50/50'
    }
  ], []);

  const [recommendSubFilter, setRecommendSubFilter] = useState<'전체' | 'AI' | '포털' | '쇼핑' | '미디어'>('전체');

  const filteredPortals = useMemo(() => {
    if (recommendSubFilter === '전체') return recommendedPortals;
    return recommendedPortals.filter(p => p.category === recommendSubFilter);
  }, [recommendSubFilter, recommendedPortals]);

  // Function to load posts from central hub
  const loadHubPosts = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setIsLoading(true);
    let hubPosts: Post[] = [];
    try {
      const response = await fetch('/api/posts');
      if (!response.ok) throw new Error(`Public posts HTTP ${response.status}`);
      hubPosts = await response.json();
    } catch (error) {
      console.error('Public posts unavailable:', error);
      setIsLiveConnected(false);
      if (showLoadingIndicator) setIsLoading(false);
      return;
    }
    if (hubPosts && hubPosts.length > 0) {
      setPosts(hubPosts);
      setIsLiveConnected(true);
    } else {
      setPosts([]);
      setIsLiveConnected(false);
    }
    setLastUpdatedTimestamp(new Date());
    if (showLoadingIndicator) setIsLoading(false);
  };

  useEffect(() => {
    loadHubPosts(true);
  }, []);
  
  // Custom mock author list
  const authors = ['김민준 IT 평론가', '서지원 트렌드 연구원', '박태양 스포츠 칼럼니스트', '이지아 시니어 에디터'];

  // Form states for adding simulated Firebase post
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubTitle, setNewSubTitle] = useState('');
  const [newCategory, setNewCategory] = useState<CategoryType>('경제');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newAuthor, setNewAuthor] = useState('소소한 웹진 시스템');
  const [newTags, setNewTags] = useState('트렌드, 인프라, 기술');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;

  // Wisdom Quotes Pool for Random Display
  const wisdomQuotes = useMemo(() => [
    { text: "아무것도 하지 않는 것은 무가치한 것이 아니다. 그것은 영혼의 호흡이다.", author: "레오 포르타" },
    { text: "우리가 삶에 의미를 부여하는 것은, 우리가 읽고 생각하는 소소한 순간들의 합이다.", author: "세네카" },
    { text: "단 하루라도 독서와 숙고를 게을리하면 마음에는 잡초가 자란다.", author: "안중근" },
    { text: "세상은 깊이 들여다보는 자에게만 그 진짜 결을 내보인다.", author: "헤르만 헤세" },
    { text: "행복은 커다란 한 번의 성취가 아니라, 매일 마주하는 작은 지적 깨달음과 아늑한 공간에 있다.", author: "알랭 드 보통" },
    { text: "바쁜 일상에서 한 걸음 물러서서 긴 글을 읽는 행위는 현대에 가장 우아한 반항이다.", author: "수전 손택" }
  ], []);

  // Selected Random Quote on Mount / Category change
  const [currentQuote, setCurrentQuote] = useState({ text: "아무것도 하지 않는 것은 무가치한 것이 아니다. 그것은 영혼의 호흡이다.", author: "레오 포르타" });
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * wisdomQuotes.length);
    setCurrentQuote(wisdomQuotes[randomIndex]);
  }, [activeCategory, wisdomQuotes]);

  // Fortune State Hooks
  const [birthMonth, setBirthMonth] = useState(1);
  const [birthDay, setBirthDay] = useState(1);
  const [fortuneResult, setFortuneResult] = useState<{
    title: string;
    insight: string;
    luckyItem: string;
    recommendCategory: string;
    recommendedPost: typeof posts[0];
  } | null>(null);
  const [isFortuneRevealed, setIsFortuneRevealed] = useState(false);

  // Dynamic system stats based on actual system day & active real views sum
  const systemStats = useMemo(() => {
    const currentDate = new Date();
    const daysOfWeek = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    const currentDayName = daysOfWeek[currentDate.getDay()];
    
    // Sum real views of current active posts
    const realTotalViews = posts.reduce((sum, p) => sum + p.views, 0) + 14831; // Base padding + real views
    
    // Vary demographics and retention slightly based on system day to feel dynamic
    const baseRetention = "5분 42초";
    const dynamicRetention = currentDate.getDay() === 0 || currentDate.getDay() === 6 
      ? "7분 15초 (주말 여유 숙독 흐름)"
      : "4분 55초 (주중 빠른 트렌드 속독)";

    return {
      dayName: currentDayName,
      totalViews: realTotalViews,
      retention: dynamicRetention,
      updateMonth: String(currentDate.getMonth() + 1).padStart(2, '0'),
      updateDay: String(currentDate.getDate()).padStart(2, '0')
    };
  }, [posts]);

  // Last Updated Date & Time calculation for Content freshness & Google Search Indexing
  const [lastUpdatedTimestamp, setLastUpdatedTimestamp] = useState<Date>(() => new Date());

  const lastUpdatedInfo = useMemo(() => {
    const d = lastUpdatedTimestamp;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return {
      date: `${year}.${month}.${day}`,
      time: `${hours}:${minutes}:${seconds}`,
      formatted: `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`,
      isoString: d.toISOString(),
      displayKorean: `${year}년 ${month}월 ${day}일 ${hours}:${minutes} (KST)`
    };
  }, [lastUpdatedTimestamp]);

  // Reset page to 1 when active category or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery]);

  // Filter posts based on active category and search query
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesCategory = activeCategory === '전체' || activeCategory === '랭킹' || post.category === activeCategory;
      const matchesSearch = 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [posts, activeCategory, searchQuery]);

  // Dynamic Hero Post state for auto-rotation and random selection (prevents locking to a single post)
  const [selectedHeroPostId, setSelectedHeroPostId] = useState<string | null>(null);

  // Automatically select a random/fresh hero post when posts load or activeCategory changes
  useEffect(() => {
    if (filteredPosts.length > 0) {
      // Pick a random post among filtered candidates
      const randomIndex = Math.floor(Math.random() * filteredPosts.length);
      setSelectedHeroPostId(filteredPosts[randomIndex].id);
    } else {
      setSelectedHeroPostId(null);
    }
  }, [activeCategory, posts.length]);

  // Function to shuffle/rotate to another editorial article on demand
  const handleShuffleHero = () => {
    if (filteredPosts.length <= 1) return;
    const candidates = filteredPosts.filter(p => p.id !== selectedHeroPostId);
    if (candidates.length > 0) {
      const nextIdx = Math.floor(Math.random() * candidates.length);
      setSelectedHeroPostId(candidates[nextIdx].id);
    }
  };

  // Find the featured post for the hero section (dynamically selected or randomized)
  const heroPost = useMemo(() => {
    if (!filteredPosts || filteredPosts.length === 0) return null;
    if (selectedHeroPostId) {
      const matched = filteredPosts.find(p => p.id === selectedHeroPostId);
      if (matched) return matched;
    }
    return filteredPosts[0];
  }, [filteredPosts, selectedHeroPostId]);

  // Rest of the posts that are not the current hero
  const regularPosts = useMemo(() => {
    if (!heroPost) return [];
    return filteredPosts.filter(p => p.id !== heroPost.id);
  }, [filteredPosts, heroPost]);

  // Paginated Posts and total count calculations
  const paginatedRegularPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * postsPerPage;
    return regularPosts.slice(startIndex, startIndex + postsPerPage);
  }, [regularPosts, currentPage, postsPerPage]);

  const paginatedFilteredPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * postsPerPage;
    return filteredPosts.slice(startIndex, startIndex + postsPerPage);
  }, [filteredPosts, currentPage, postsPerPage]);

  const totalPages = useMemo(() => {
    const totalItems = searchQuery === '' ? regularPosts.length : filteredPosts.length;
    return Math.ceil(totalItems / postsPerPage);
  }, [searchQuery, regularPosts, filteredPosts, postsPerPage]);

  // Dynamic Real-time hot ranking computed on live view counts (Top 10)
  const rankingPosts = useMemo(() => {
    return [...posts].sort((a, b) => b.views - a.views).slice(0, 10);
  }, [posts]);

  // Dynamic Editor's Choice article picker for high-density side columns
  const editorsPickPost = useMemo(() => {
    // Select the second article to avoid duplication with the prominent hero banner on the main page
    if (posts.length > 1) {
      return posts[1];
    }
    return posts[0] || null;
  }, [posts]);

  // Deterministic daily horoscope calculator based on birth month/day & today's date
  const handleRevealFortune = () => {
    const currentDate = new Date();
    // Deterministic seed based on birth date and today's day of the month + month
    const seed = birthMonth * 31 + birthDay + currentDate.getDate() + currentDate.getMonth();
    
    const fortunePool = [
      {
        title: "동요하지 않는 고요한 독서가의 하루",
        insight: "오늘은 외부의 소사로운 소음에서 한 발짝 물러나 고적한 지적 평화를 만끽하기 완벽한 날입니다. 긴 글 에세이나 정교한 테크 칼럼을 읽을 때 머릿속의 안개가 걷히며, 뜻밖의 영역에서 빛나는 비즈니스 힌트가 쏟아집니다.",
        luckyItem: "얼음 둥둥 띄운 콜드브루 & 무광 블랙 가죽 커버 수첩",
        recommendCategory: "IT"
      },
      {
        title: "지적 안목과 자산의 동풍이 불어오는 운세",
        insight: "안목과 재정적 판단력이 동시에 크게 자라나는 날입니다. 성급히 계약서에 서명하거나 지출을 결정하기보다, 거시적 금리 동향과 시장 분석 가이드라인을 담은 긴 글을 차분히 15분 숙독하십시오. 평생의 안목을 키워줍니다.",
        luckyItem: "황금 촉 만년필 & 한 번 우려낸 둥굴레 단차",
        recommendCategory: "경제"
      },
      {
        title: "문화적 심미안과 감수성이 절정에 달하는 흐름",
        insight: "감수성과 안목이 최고치로 솟아오릅니다. 평소 아무 생각 없이 스치던 주거 소품, 찻잔, 혹은 영화 속 디테일에서 숨은 거장의 미학(이스터에그)을 단번에 찾아냅니다. 감각적인 문화 콘텐츠나 드라마 글이 영감을 줍니다.",
        luckyItem: "노이즈 캔슬링 오디오 & 달콤한 시나몬 밀크티",
        recommendCategory: "드라마"
      },
      {
        title: "누적되었던 해묵은 피로가 사르르 씻겨갈 시간",
        insight: "그동안 비즈니스나 바쁜 일상에서 얽혔던 작은 오해와 마음의 긴장이 따사로운 여행 에세이를 보며 가볍게 치유되는 운입니다. 오늘은 다른 이들이 아늑하게 머물다 간 국내외 여행 기록을 읽으며 온전한 대리 회복을 느껴보세요.",
        luckyItem: "시트러스 향 캔들 & 따뜻하게 구운 아메리카노",
        recommendCategory: "사회"
      },
      {
        title: "새로운 지식의 마일스톤과 랜드마크를 발견하는 행운",
        insight: "단조롭던 서핑 속에서 눈이 번쩍 뜨이는 알짜배기 고감도 포털 정보나 미적 사이트를 찾아낼 조짐입니다. 수집과 정리의 효율이 아주 좋으니, 오늘 배운 유용한 지식 도구들을 메모에 일목요연하게 차곡차곡 스크랩해두면 큰 자산이 됩니다.",
        luckyItem: "두꺼운 재생지 무지 노트 & 은은한 자스민 허브티",
        recommendCategory: "추천"
      }
    ];

    const index = seed % fortunePool.length;
    const selectedFortune = fortunePool[index];

    // Find recommended article based on category
    const matches = posts.filter(p => p.category === selectedFortune.recommendCategory);
    const recommendedPost = matches.length > 0 ? matches[seed % matches.length] : posts[seed % posts.length];

    setFortuneResult({ ...selectedFortune, recommendedPost });
    setIsFortuneRevealed(true);
  };

  // Function to add a post (Simulating Firebase write/snapshot updates)
  const handleCreatePostMock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newExcerpt.trim()) {
      alert('제목과 요약 내용을 입력해주세요.');
      return;
    }

    const defaultImages: Record<CategoryType, string> = {
      '경제': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800',
      '드라마': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=800',
      '스포츠': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
      'IT': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
      '사회': 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=800',
      '랭킹': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800',
      '추천': 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&q=80&w=800'
    };

    const finalImage = newImageUrl.trim() || defaultImages[newCategory];
    const tagArray = newTags.split(',').map(t => t.trim()).filter(Boolean);

    const generatedPost: Post = {
      id: `custom-${Date.now()}`,
      title: newTitle,
      subTitle: newSubTitle || undefined,
      excerpt: newExcerpt,
      content: newContent.trim() 
        ? newContent.replace(/\n/g, '<br/>') 
        : `<h2>새롭게 발행된 ${newCategory} 소식</h2><p>${newExcerpt}</p><p>본 콘텐츠는 소소한 웹진의 파이어베이스 동기화 시뮬레이션을 통해 동적으로 주입되었습니다. 파이어베이스 데이터베이스 연동 시 이와 동일한 구조로 Firestore에 자동 기록됩니다.</p>`,
      category: newCategory,
      imageUrl: finalImage,
      author: newAuthor,
      createdAt: new Date().toLocaleDateString('ko-KR').replace(/\s/g, '').slice(0, -1),
      readTime: '4 min read',
      featured: false,
      views: 1,
      tags: tagArray.length > 0 ? tagArray : ['새소식', '실시간']
    };

    setPosts([generatedPost, ...posts]);
    setLastUpdatedTimestamp(new Date());
    setIsAddingPost(false);
    
    // Reset Form
    setNewTitle('');
    setNewSubTitle('');
    setNewExcerpt('');
    setNewContent('');
    setNewImageUrl('');
    setNewAuthor('소소한 웹진 시스템');
    setNewTags('트렌드, 인프라, 기술');

    // Scroll to list
    const listElement = document.getElementById('webzine-list');
    if (listElement) {
      listElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Open post and push state to /blog/:id
  const handleOpenPost = (post: Post) => {
    setSelectedPost(post);
    setIsPostNotFound(false);
    if (typeof window !== 'undefined') {
      window.history.pushState({ postId: post.id }, '', `/blog/${post.id}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Back to list and restore home URL and SEO
  const handleBackToList = () => {
    setSelectedPost(null);
    setIsPostNotFound(false);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/');
      document.title = '소소한 웹진 - 전문적인 내용과 지식을 담은 명품 웹진';
      const descMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (descMeta) descMeta.content = '소소한 웹진은 전문적인 내용과 지식을 깊이 있게 전하는 프리미엄 명품 에디토리얼 웹진 서비스입니다.';
      let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = window.location.origin;
      const robotsMeta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
      if (robotsMeta) robotsMeta.content = 'index, follow';

      setTimeout(() => {
        const listElement = document.getElementById('webzine-list');
        if (listElement) listElement.scrollIntoView({ behavior: 'auto' });
      }, 50);
    }
  };

  // Sync URL changes (e.g. Back/Forward button and direct URL visits)
  useEffect(() => {
    const handleUrlRoute = () => {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/blog/')) {
        const postId = pathname.replace('/blog/', '').trim();
        if (postId) {
          const matched = posts.find(p => p.id === postId);
          if (matched) {
            setSelectedPost(matched);
            setIsPostNotFound(false);
          } else if (!isLoading) {
            // Checked and not found
            setSelectedPost(null);
            setIsPostNotFound(true);
          }
        }
      } else {
        setSelectedPost(null);
        setIsPostNotFound(false);
      }
    };

    window.addEventListener('popstate', handleUrlRoute);

    // Initial check if window.__INITIAL_POST__ wasn't injected but URL is /blog/:id
    if (!selectedPost && !isPostNotFound && window.location.pathname.startsWith('/blog/')) {
      handleUrlRoute();
    }

    return () => {
      window.removeEventListener('popstate', handleUrlRoute);
    };
  }, [posts, isLoading]);

  // Client-side 404 SEO head management
  useEffect(() => {
    if (isPostNotFound) {
      document.title = '글을 찾을 수 없습니다 | 소소한 웹진';
      const robotsMeta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
      if (robotsMeta) robotsMeta.content = 'noindex, follow';
      const canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (canonicalLink) canonicalLink.remove(); // Strictly NO canonical for 404 page!
    }
  }, [isPostNotFound]);

  return (
    <div className="bg-[#FAF9F6] text-neutral-900 min-h-screen font-sans selection:bg-rose-500 selection:text-white">
      
      {/* Real 404 Not Found Page */}
      {isPostNotFound ? (
        <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-between">
          <Header 
            activeCategory={activeCategory} 
            onCategoryChange={setActiveCategory} 
            totalPostsCount={posts.length}
            lastUpdated={lastUpdatedInfo}
          />
          <main className="max-w-3xl mx-auto px-4 py-20 text-center flex-1 flex flex-col items-center justify-center">
            <div className="bg-white border-2 border-neutral-900 p-8 sm:p-12 shadow-[8px_8px_0px_0px_rgba(225,29,72,0.2)] max-w-xl w-full">
              <span className="inline-block px-3 py-1 bg-rose-100 text-rose-800 text-xs font-mono font-bold tracking-widest uppercase border border-rose-300 mb-6">
                ■ 404 ERROR // NOT FOUND
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-black text-neutral-950 mb-4 tracking-tight">
                요청한 글을 찾을 수 없습니다.
              </h1>
              <p className="text-neutral-600 text-sm sm:text-base leading-relaxed mb-8 font-serif">
                방문하신 주소의 게시글이 삭제되었거나, 비공개 상태이거나, 잘못된 링크로 접근하셨습니다.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleBackToList}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-rose-600 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>소소한 웹진 메인 홈으로 이동</span>
                </button>
              </div>
            </div>
          </main>
          <footer className="border-t border-neutral-200 py-6 text-center text-xs font-mono text-neutral-500">
            © {new Date().getFullYear()} 소소한 웹진. All rights reserved.
          </footer>
        </div>
      ) : selectedPost ? (
        <PostDetail 
          post={selectedPost} 
          onBack={handleBackToList} 
        />
      ) : (
        <>
          {/* Header Component with Content Count & Last Updated DateTime for SEO */}
          <Header 
            activeCategory={activeCategory} 
            onCategoryChange={setActiveCategory} 
            totalPostsCount={posts.length}
            lastUpdated={lastUpdatedInfo}
          />


          {/* Main Layout */}
          <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">

            {/* Premium Dark Forest Green Wide Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#062419] via-[#093d28] to-[#031d12] text-white p-6 sm:p-8 md:p-12 rounded-2xl md:rounded-3xl shadow-[0_15px_35px_-10px_rgba(4,44,28,0.4)] mb-10 border border-[#0b4831]/40 group">
              {/* Subtle ambient light glow effect */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                {/* Badge Row */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="bg-[#0b4e33] border border-[#14724b] text-emerald-300 font-mono text-[9px] md:text-[10px] tracking-wider font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                    <span>SOSO PREMIUM EDITORIAL</span>
                  </div>
                  <div className="bg-white/10 text-emerald-100 font-mono text-[9px] md:text-[10px] px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm">
                    전문지식 & 명품 오피니언 // SECURE
                  </div>
                </div>

                {/* Main Hero Typography */}
                <div className="space-y-3 max-w-4xl">
                  <h2 className="font-serif font-bold text-lg sm:text-xl md:text-2xl text-[#FAF9F6] tracking-tight leading-tight group-hover:text-emerald-300 transition-colors duration-300">
                    전문적인 내용과 지식을 깊이 있게 담아낸 고품격 명품 웹진
                  </h2>
                  <p className="text-[11px] sm:text-xs md:text-sm text-emerald-200/70 font-sans leading-relaxed">
                    단순한 이슈의 소비나 자극적인 나열을 과감히 해체하고, 지식을 향한 탐구와 에스테틱 필터링을 거친 고감도 칼럼을 매일 제공합니다. 
                    경제, 문화, 스포츠 과학, 최신 트렌드를 넘나들며 지적 갈증을 채워줄 정돈된 에세이와 국내외 랜드마크 사이트 추천 포털을 소소하게 제안합니다.
                  </p>
                </div>

                {/* Meta details & interactive button */}
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-emerald-900/40">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-emerald-300/90 font-mono">
                    <span className="flex items-center gap-1 font-bold text-emerald-200">
                      <span>■</span> EDITION NO. 42
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 bg-[#0b4e33]/90 px-2.5 py-0.5 rounded border border-emerald-700/60 shadow-xs">
                      <span>전체 콘텐츠:</span>
                      <strong className="text-white font-black">{posts.length}편</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 bg-[#0b4e33]/60 px-2.5 py-0.5 rounded border border-emerald-800/40">
                      <span>최종 업데이트:</span>
                      <time dateTime={lastUpdatedInfo.isoString} className="text-white font-bold">
                        {lastUpdatedInfo.formatted}
                      </time>
                    </span>
                    <span className="hidden md:inline">•</span>
                    <span className="hidden md:inline text-emerald-400/80">GOOGLE SEARCH SYNCED</span>
                  </div>
                  
                  <button 
                    onClick={() => {
                      const listElement = document.getElementById('webzine-list');
                      if (listElement) listElement.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1.5 bg-[#14724b] hover:bg-[#1a8d5e] text-white px-4 py-2 text-[10px] sm:text-xs font-mono font-bold tracking-wider rounded-lg transition-all duration-150 shadow-md group/btn"
                  >
                    <span>에디토리얼 목록 탐색하기</span>
                    <span className="transition-transform duration-200 group-hover/btn:translate-y-0.5">↓</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Asymmetrical 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="webzine-list">
              
              {/* Left Column: Post Display (Hero + Grid/List) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Search and Category indicator with Content Volume & Freshness */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-300 pb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                        TOPIC: {activeCategory}
                      </span>
                      <span className="text-[10px] font-mono bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded font-bold">
                        발행 콘텐츠: {filteredPosts.length}편 / 전체 {posts.length}편
                      </span>
                      <span className="text-[10px] font-mono bg-neutral-100 text-neutral-600 border border-neutral-200 px-2 py-0.5 rounded flex items-center gap-1">
                        <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                        <span>최종 갱신:</span>
                        <time dateTime={lastUpdatedInfo.isoString} className="text-neutral-900 font-semibold">{lastUpdatedInfo.formatted}</time>
                      </span>
                    </div>
                    <h2 className="font-serif text-base sm:text-lg font-black text-neutral-950">
                      {activeCategory === '전체' ? '에디토리얼 전체 기사 목록' : `‘${activeCategory}’ 카테고리 심층 분석`}
                    </h2>
                  </div>

                  {/* Clean Search Input */}
                  <div className="relative w-full sm:w-56">
                    <input
                      type="text"
                      placeholder="키워드 또는 태그 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-[11px] bg-white border border-neutral-300 focus:border-neutral-900 focus:outline-none transition-colors rounded-none font-mono"
                    />
                    <Search className="absolute left-2.5 top-2.5 text-neutral-400" size={12} />
                  </div>
                </div>

                {isLoading ? (
                  <div className="space-y-6 py-6">
                    <div className="flex flex-col items-center justify-center gap-3 text-neutral-500 font-serif italic text-xs sm:text-sm py-16 bg-white border border-neutral-200 shadow-sm">
                      <RefreshCw size={20} className="animate-spin text-rose-600 mb-2" />
                      <span>소소한 웹진 오리지널 콘텐츠 라이브러리 연동 중...</span>
                      <span className="text-[10px] font-mono text-neutral-400 not-italic">weather-49c44 // ai-studio-aiwebzineblog-dadec710</span>
                    </div>
                  </div>
                ) : activeCategory === '랭킹' ? (
                  <div className="space-y-8 animate-fade-in">
                    {/* Part 1: Sleek Vertical Leaderboard */}
                    <div className="space-y-4">
                      <span className="block text-[11px] font-mono font-bold tracking-widest text-neutral-400 uppercase">
                        ■ REAL-TIME HOT TREND LEADERBOARD (TOP 10)
                      </span>
                      
                      <div className="bg-[#FAF9F6] border border-neutral-900 shadow-[4px_4px_0px_0px_rgba(23,23,23,1)] overflow-hidden">
                        <div className="divide-y divide-neutral-200">
                          {rankingPosts.map((post, index) => (
                            <div 
                              key={post.id}
                              onClick={() => handleOpenPost(post)}
                              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-white transition-all duration-200 cursor-pointer"
                            >
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                {/* Rank indicator with custom sizes */}
                                <div className="w-10 flex-shrink-0 text-center">
                                  <span className={`font-serif italic text-2xl sm:text-3xl font-black ${index < 3 ? 'text-rose-600' : 'text-neutral-300'}`}>
                                    {String(index + 1).padStart(2, '0')}
                                  </span>
                                </div>

                                {/* Image with TOP ribbon for 1st-3rd */}
                                <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 overflow-hidden border border-neutral-900 bg-neutral-100 relative shadow-sm">
                                  <ImageGuard 
                                    category={post.category}
                                    postId={post.id}
                                    src={post.imageUrl} 
                                    alt={post.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  {index < 3 && (
                                    <span className="absolute top-0 left-0 bg-rose-600 text-white text-[7px] sm:text-[8px] font-mono font-bold px-1 py-0.5 uppercase tracking-wider">
                                      TOP
                                    </span>
                                  )}
                                </div>

                                {/* Editorial Content Details */}
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[9px] font-mono font-bold text-rose-600 tracking-wider uppercase border border-rose-100 bg-rose-50 px-1.5 py-0.2">
                                      {post.category}
                                    </span>
                                    <span className="text-[9px] font-mono text-neutral-400">
                                      {post.createdAt}
                                    </span>
                                  </div>
                                  <h3 className="font-serif font-black text-xs sm:text-sm text-neutral-950 group-hover:text-rose-600 transition-colors leading-snug truncate">
                                    {post.title}
                                  </h3>
                                  <p className="text-[10px] sm:text-[11px] text-neutral-500 line-clamp-1 sm:line-clamp-2 font-sans leading-relaxed">
                                    {post.excerpt}
                                  </p>
                                </div>
                              </div>

                              {/* View / Traffic Statistics (Right Aligned on Desktop) */}
                              <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 border-neutral-100 pt-2 sm:pt-0 pl-14 sm:pl-0">
                                <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block">
                                  BY {post.author.replace(' 최고 관리자', '').replace(' 수석 에디터', '').toUpperCase()}
                                </span>
                                <div className="flex items-center gap-1.5 bg-neutral-100 px-2 py-1 rounded-sm">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                  <span className="text-[10px] font-mono text-neutral-800 font-bold">
                                    조회 {post.views.toLocaleString()}회
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Part 2: Interactive Fortune & Dynamic Analytics Dashboard (Fills space with premium interactive value) */}
                    <div className="space-y-6">
                      
                      {/* Section A: Today's Wisdom Quote Card (오늘의 문장 서재) */}
                      <div className="border border-neutral-900 bg-[#FAF9F6] p-5 shadow-[3px_3px_0px_0px_rgba(225,29,72,0.15)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-neutral-950 text-white font-mono text-[8px] font-bold px-2 py-0.5 uppercase tracking-widest">
                          Today's Quote
                        </div>
                        <span className="block text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                          ■ 오늘의 문장 서재
                        </span>
                        <p className="font-serif text-neutral-800 text-xs sm:text-sm leading-relaxed italic pr-8">
                          "{currentQuote.text}"
                        </p>
                        <span className="block text-[10px] font-mono text-rose-600 text-right mt-2 font-bold">
                          — {currentQuote.author}
                        </span>
                      </div>

                      {/* Section B: Interactive Daily Fortune Selector (소소한 지성 운세 서재) */}
                      <div className="border border-neutral-900 bg-white p-6 shadow-[4px_4px_0px_0px_rgba(23,23,23,1)] space-y-4">
                        <div className="border-b border-neutral-200 pb-2.5">
                          <span className="text-[9px] font-mono font-bold text-rose-600 tracking-wider uppercase bg-rose-50 px-2 py-0.5">
                            ■ DAILY INTELLECT HOROSCOPE
                          </span>
                          <h3 className="font-serif font-bold text-sm sm:text-base text-neutral-950 mt-1">
                            소소한 지성 운세 & 행운의 독서 가이드
                          </h3>
                        </div>

                        {!isFortuneRevealed ? (
                          <div className="space-y-4">
                            <p className="text-[11px] text-neutral-500 font-sans leading-relaxed">
                              태어난 월과 일을 입력하시면 오늘 접속한 날짜({systemStats.updateMonth}월 {systemStats.updateDay}일 {systemStats.dayName})의 지성 흐름을 정교하게 분석하여, 행운을 부르는 특별한 행동 지침과 서재 아이템, 맞춤 아티클을 점쳐드립니다.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="block text-[9px] font-mono font-bold text-neutral-400 uppercase">Birth Month (생성 월)</label>
                                <select 
                                  value={birthMonth}
                                  onChange={(e) => setBirthMonth(Number(e.target.value))}
                                  className="w-full border border-neutral-300 p-2 text-xs font-mono focus:outline-none focus:border-rose-600 bg-[#FAF9F6]"
                                >
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m}>{m}월</option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[9px] font-mono font-bold text-neutral-400 uppercase">Birth Day (생성 일)</label>
                                <select 
                                  value={birthDay}
                                  onChange={(e) => setBirthDay(Number(e.target.value))}
                                  className="w-full border border-neutral-300 p-2 text-xs font-mono focus:outline-none focus:border-rose-600 bg-[#FAF9F6]"
                                >
                                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                    <option key={d} value={d}>{d}일</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <button
                              onClick={handleRevealFortune}
                              className="w-full py-2 bg-neutral-950 hover:bg-rose-600 text-white text-xs font-mono font-bold transition-colors shadow-[2px_2px_0px_0px_rgba(225,29,72,1)] hover:shadow-none"
                            >
                              오늘의 지성 운세 열어보기 (REVEAL CARD) &rarr;
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4 animate-fade-in bg-[#FAF9F6] border border-rose-100 p-4 relative">
                            <div className="absolute top-2 right-2">
                              <span className="text-[7px] sm:text-[8px] font-mono bg-rose-600 text-white font-bold px-1.5 py-0.5 uppercase tracking-widest">
                                DECRYPTION SUCCESS
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              <span className="text-[10px] font-mono text-neutral-400 font-bold block uppercase tracking-widest">
                                {birthMonth}월 {birthDay}일 출생 독자의 {systemStats.dayName} 지향점
                              </span>
                              <h4 className="font-serif font-black text-sm sm:text-base text-rose-600 border-b border-rose-200 pb-1.5">
                                🔮 {fortuneResult?.title}
                              </h4>
                              <p className="text-[11px] sm:text-xs text-neutral-700 font-serif leading-relaxed italic pt-1">
                                "{fortuneResult?.insight}"
                              </p>
                            </div>

                            {/* Lucky item box */}
                            <div className="bg-white border border-neutral-200 p-2.5 space-y-1 rounded-sm shadow-sm">
                              <span className="block text-[8px] font-mono text-rose-500 font-black uppercase tracking-widest">
                                ■ 행운을 동반하는 서재 아이템
                              </span>
                              <span className="text-xs font-bold text-neutral-900 font-sans block">
                                {fortuneResult?.luckyItem}
                              </span>
                            </div>

                            {/* Recommended dynamic article redirection button */}
                            {fortuneResult?.recommendedPost && (
                              <div className="border border-dashed border-rose-300 p-3 bg-rose-50/30 space-y-2 rounded-sm">
                                <span className="block text-[8px] font-mono text-neutral-400 font-bold uppercase tracking-wider">
                                  오늘의 추천 칼럼 독서 제안
                                </span>
                                <h5 className="font-serif font-bold text-xs text-neutral-950 truncate">
                                  {fortuneResult.recommendedPost.title}
                                </h5>
                                <button
                                  onClick={() => {
                                    if (fortuneResult?.recommendedPost) {
                                      setSelectedPost(fortuneResult.recommendedPost);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }
                                  }}
                                  className="py-1 px-3 bg-neutral-950 hover:bg-rose-600 text-[10px] text-white font-mono font-bold transition-colors uppercase"
                                >
                                  추천 에세이 즉시 탐독 &rarr;
                                </button>
                              </div>
                            )}

                            <button
                              onClick={() => {
                                setIsFortuneRevealed(false);
                                setFortuneResult(null);
                              }}
                              className="w-full text-center py-1 text-[9px] font-mono text-neutral-400 hover:text-rose-600 uppercase transition-colors"
                            >
                              [ 다른 생일 날짜 분석하기 ]
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Section C: Live Readership Dashboard & Analytics Report (Reflects actual weekday dynamic stats & actual view counts) */}
                      <div className="border border-neutral-900 bg-white p-6 shadow-[4px_4px_0px_0px_rgba(23,23,23,1)] space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono font-bold text-rose-600 tracking-wider uppercase bg-rose-50 px-2 py-0.5">
                              ■ DYNAMIC TRACTION REPORT
                            </span>
                            <h3 className="font-serif font-bold text-sm sm:text-base text-neutral-950">
                              실시간 트랙션 & 독자 활동 통계 ({systemStats.dayName})
                            </h3>
                          </div>
                          <span className="text-[9px] font-mono text-neutral-400 bg-neutral-50 border border-neutral-200 px-2.5 py-1">
                            동적 계산: 2026.{systemStats.updateMonth}.{systemStats.updateDay}
                          </span>
                        </div>

                        {/* Stats Overview with actual accumulated view values */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          <div className="border border-neutral-200 p-3 bg-[#FAF9F6]">
                            <span className="block text-[8px] font-mono text-neutral-400 uppercase tracking-wider">누적 지식 조회수</span>
                            <span className="text-xs sm:text-sm font-serif font-bold text-neutral-950 block mt-1">
                              {systemStats.totalViews.toLocaleString()}회
                            </span>
                          </div>
                          <div className="border border-neutral-200 p-3 bg-[#FAF9F6]">
                            <span className="block text-[8px] font-mono text-neutral-400 uppercase tracking-wider">주요 독자 성향</span>
                            <span className="text-xs sm:text-sm font-serif font-bold text-neutral-950 block mt-1">
                              학술/에세이 선호 (89%)
                            </span>
                          </div>
                          <div className="border border-neutral-200 p-3 bg-[#FAF9F6] col-span-2 sm:col-span-1">
                            <span className="block text-[8px] font-mono text-neutral-400 uppercase tracking-wider">평균 지면 체류시간</span>
                            <span className="text-[10px] sm:text-xs font-serif font-bold text-neutral-950 block mt-1">
                              {systemStats.retention}
                            </span>
                          </div>
                        </div>

                        {/* Mini Readership Hourly Traffic Line Chart (Pure CSS/SVG) */}
                        <div className="space-y-2">
                          <span className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                            ■ WEEKLY HOURLY READERSHIP TRAFFIC PEAKS
                          </span>
                          <div className="border border-neutral-200 bg-[#FAF9F6] p-4 rounded-sm">
                            <div className="h-24 w-full flex items-end justify-between pt-4 px-2 relative">
                              {/* SVG Sparkline (Shape changes deterministically based on what day of week it is!) */}
                              <svg className="absolute inset-x-0 bottom-0 h-16 w-full" preserveAspectRatio="none">
                                <path
                                  d={`M 0 60 Q 50 ${new Date().getDay() * 7 + 10}, 100 40 T 200 ${new Date().getDay() * 4 + 15} T 300 50 T 400 ${35 - new Date().getDay() * 3} T 500 35 Q 550 50, 600 55`}
                                  fill="none"
                                  stroke="#e11d48"
                                  strokeWidth="2"
                                  className="vector-effect-non-scaling-stroke"
                                />
                              </svg>
                              {/* Vertical labels and bars for visualization */}
                              <div className="flex flex-col items-center z-10">
                                <span className="text-[8px] font-mono text-neutral-400">08:00</span>
                                <div className={`w-1 h-8 rounded-t ${new Date().getDay() % 2 === 0 ? 'bg-rose-600/30' : 'bg-rose-600/10'}`} />
                              </div>
                              <div className="flex flex-col items-center z-10">
                                <span className="text-[8px] font-mono text-neutral-400">12:00</span>
                                <div className="w-1 h-12 bg-rose-600/15 rounded-t" />
                              </div>
                              <div className="flex flex-col items-center z-10">
                                <span className="text-[8px] font-mono text-neutral-400">18:00</span>
                                <div className="w-1 h-6 bg-rose-600/10 rounded-t" />
                              </div>
                              <div className="flex flex-col items-center z-10">
                                <span className="text-[8px] font-mono text-neutral-400">21:00</span>
                                <div className={`w-1 h-16 rounded-t ${new Date().getDay() % 2 !== 0 ? 'bg-rose-600/40' : 'bg-rose-600/20'}`} />
                              </div>
                              <div className="flex flex-col items-center z-10">
                                <span className="text-[8px] font-mono text-neutral-400">01:00</span>
                                <div className="w-1 h-4 bg-rose-600/5 rounded-t" />
                              </div>
                            </div>
                            <span className="block text-[8px] font-mono text-neutral-400 text-center mt-2.5">
                              ※ 오늘은 {systemStats.dayName} 지표가 연계되어 출퇴근과 지적 탐구 피크 트랙션 그래프가 동적으로 렌더링되었습니다.
                            </span>
                          </div>
                        </div>

                        {/* Interactive Popular Hot Search Keywords Cloud */}
                        <div className="space-y-2">
                          <span className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                            ■ HOT KEYWORDS SEARCH (CLICK TO INSTANT FILTER)
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { tag: '드라마', label: '#드라마 트렌드' },
                              { tag: '가족', label: '#가족 에세이' },
                              { tag: 'IT', label: '#최첨단 IT' },
                              { tag: '국내여행', label: '#국내 명소' },
                              { tag: '소품', label: '#인테리어 소품' },
                              { tag: '해외여행', label: '#해외 랜드마크' },
                              { tag: '웹툰', label: '#대중문화 웹툰' },
                              { tag: '재테크', label: '#금리/재테크' },
                              { tag: 'AI', label: '#생성형 AI' }
                            ].map((item) => (
                              <button
                                key={item.tag}
                                onClick={() => {
                                  setActiveCategory('전체');
                                  setSearchQuery(item.tag);
                                  const viewElement = document.getElementById('webzine-list');
                                  if (viewElement) viewElement.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="text-[10px] sm:text-xs font-mono px-2.5 py-1 bg-neutral-50 hover:bg-neutral-950 hover:text-white border border-neutral-200 transition-colors duration-150"
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Editor's Opinion Note */}
                        <div className="p-4 bg-rose-50/50 border-l-4 border-rose-600 space-y-1">
                          <span className="text-[8px] font-mono font-bold text-rose-600 uppercase tracking-widest block">■ CHIEF EDITOR'S INSIGHT NOTE</span>
                          <p className="text-[11px] sm:text-xs text-neutral-700 font-serif leading-relaxed italic">
                            "오늘은 <strong className="text-rose-600 font-bold">{systemStats.dayName}</strong> 접속 트래픽과 누적 데이터에 의거해 독자님들을 위한 개인화된 <strong className="text-rose-600 font-bold">지성 운세 가이드</strong>와 한 줄 명언을 상단에 큐레이션해 두었습니다. 가볍게 하루의 정서를 정돈하고 추천 아티클의 깊은 문장들을 음미해 보십시오."
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                ) : activeCategory === '추천' ? (
                  <div className="space-y-8 animate-fade-in">
                    
                    {/* Header bar */}
                    <div className="flex justify-between items-center border-b-2 border-neutral-900 pb-2.5">
                      <span className="text-[11px] font-mono font-bold tracking-widest text-neutral-400 uppercase">
                        ■ SELECTIVE LANDMARK PORTALS & COGNITIVE TOOLS
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-rose-600 text-white px-2 py-0.5">
                        EDITORIAL TOP 8
                      </span>
                    </div>

                    {/* Highly Interactive Micro Sub-Filters */}
                    <div className="flex flex-wrap gap-2 pt-2 border-b border-neutral-200 pb-4">
                      {(['전체', 'AI', '포털', '쇼핑', '미디어'] as const).map((filter) => {
                        const isSubActive = recommendSubFilter === filter;
                        return (
                          <button
                            key={filter}
                            onClick={() => setRecommendSubFilter(filter)}
                            className={`px-3 py-1 text-xs font-mono tracking-wider transition-all duration-150 rounded-none border ${
                              isSubActive
                                ? 'bg-neutral-950 text-white border-neutral-950 font-bold shadow-[2px_2px_0px_0px_rgba(225,29,72,1)]'
                                : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-900 hover:text-neutral-900'
                            }`}
                          >
                            {filter === '전체' ? 'ALL' : filter}
                          </button>
                        );
                      })}
                    </div>

                    {/* Advanced Bento Grid of Recommended Sites */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      {filteredPortals.map((portal) => (
                        <div
                          key={portal.id}
                          className={`border-l-4 ${portal.color} bg-white p-5 sm:p-6 border border-neutral-200 hover:border-neutral-900 transition-all duration-300 flex flex-col justify-between space-y-4 group hover:shadow-[4px_4px_0px_0px_rgba(23,23,23,1)]`}
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className={`text-[9px] font-mono font-black tracking-widest px-2 py-0.5 ${portal.bgColor} ${portal.textColor} uppercase border border-neutral-200/50`}>
                                {portal.badge}
                              </span>
                              <span className="text-[10px] font-mono text-neutral-400">
                                #{portal.tag}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <h3 className="font-serif font-black text-xl text-neutral-950 group-hover:text-rose-600 transition-colors duration-150">
                                {portal.name}
                              </h3>
                              <p className="text-neutral-600 font-sans leading-relaxed text-xs sm:text-sm">
                                {portal.description}
                              </p>
                            </div>
                          </div>

                          {/* Editor's Verdict Section */}
                          <div className="pt-3 border-t border-neutral-100 space-y-3">
                            <div className="bg-neutral-50 p-3 border-l border-neutral-300">
                              <span className="block text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-1">
                                ■ EDITOR'S VERDICT
                              </span>
                              <p className="text-neutral-700 font-serif italic text-[11px] sm:text-xs leading-relaxed">
                                "{portal.verdict}"
                              </p>
                            </div>

                            {/* Link and Action button */}
                            <div className="flex justify-end pt-1">
                              <a
                                href={portal.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 bg-neutral-950 text-white px-3.5 py-1.5 text-[10px] sm:text-xs font-mono font-bold tracking-wider hover:bg-rose-600 transition-colors duration-150"
                              >
                                <span>공식 사이트 바로가기</span>
                                <span className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Empty State */}
                    {filteredPosts.length === 0 && (
                      <div className="text-center py-12 bg-white border border-neutral-200">
                        <p className="font-serif text-sm text-neutral-600 mb-1">검색 결과 또는 해당하는 글이 없습니다.</p>
                        <p className="text-[10px] text-neutral-400 font-mono">검색어를 수정하거나 우측 제어판에서 모의 데이터를 추가해보세요.</p>
                      </div>
                    )}

                    {/* Hero Feature Article (Only if there are matching posts) */}
                    {heroPost && searchQuery === '' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="block text-[11px] font-mono font-bold tracking-widest text-neutral-400 uppercase">
                            ■ TODAY'S EXCLUSIVE EDITORIAL (투데이 에디토리얼)
                          </span>
                          <button 
                            onClick={handleShuffleHero}
                            title="다른 주요 에디토리얼 기사로 변경"
                            className="inline-flex items-center gap-1.5 text-[10px] font-mono text-neutral-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-neutral-300 hover:border-rose-300 px-2.5 py-1 transition-all shadow-xs cursor-pointer font-bold"
                          >
                            <Shuffle size={11} className="text-rose-600" />
                            <span>랜덤 에디토리얼 추천 ↻</span>
                          </button>
                        </div>
                        <PostCard 
                          post={heroPost} 
                          onClick={() => handleOpenPost(heroPost)} 
                          isHero={true} 
                        />
                      </div>
                    )}

                    {/* Regular Article Grid */}
                    {regularPosts.length > 0 && (
                      <div className="space-y-6">
                        <span className="block text-[11px] font-mono font-bold tracking-widest text-neutral-400 uppercase">
                          ■ LATEST ESSAYS & ARTICLES (PAGE {currentPage}/{totalPages || 1})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {paginatedRegularPosts.map((post) => (
                            <PostCard
                              key={post.id}
                              post={post}
                              onClick={() => handleOpenPost(post)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* If searchQuery is active and hero is not separated, show simple grid */}
                    {searchQuery !== '' && filteredPosts.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {paginatedFilteredPosts.map((post) => (
                          <PostCard
                              key={post.id}
                              post={post}
                              onClick={() => {
                                setSelectedPost(post);
                                window.scrollTo({ top: 0 });
                              }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Highly Aesthetic Editorial Pagination UI */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-10 border-t border-neutral-200 mt-8 font-mono text-xs">
                        <button
                          onClick={() => {
                            setCurrentPage(prev => Math.max(prev - 1, 1));
                            const gridElement = document.getElementById('webzine-list');
                            if (gridElement) gridElement.scrollIntoView({ behavior: 'smooth' });
                          }}
                          disabled={currentPage === 1}
                          className={`px-3 py-1.5 border transition-all ${
                            currentPage === 1
                              ? 'text-neutral-300 border-neutral-100 cursor-not-allowed'
                              : 'text-neutral-800 border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 font-bold'
                          }`}
                        >
                          &larr; PREV
                        </button>
                        
                        <div className="flex items-center gap-1.5">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                            <button
                              key={pageNum}
                              onClick={() => {
                                setCurrentPage(pageNum);
                                const gridElement = document.getElementById('webzine-list');
                                if (gridElement) gridElement.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className={`w-8 h-8 flex items-center justify-center border transition-all text-xs ${
                                currentPage === pageNum
                                  ? 'bg-neutral-950 text-white border-neutral-950 font-bold shadow-[2px_2px_0px_0px_rgba(225,29,72,1)]'
                                  : 'text-neutral-600 border-neutral-200 hover:border-neutral-900 hover:text-neutral-900 bg-white'
                              }`}
                            >
                              {String(pageNum).padStart(2, '0')}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => {
                            setCurrentPage(prev => Math.min(prev + 1, totalPages));
                            const gridElement = document.getElementById('webzine-list');
                            if (gridElement) gridElement.scrollIntoView({ behavior: 'smooth' });
                          }}
                          disabled={currentPage === totalPages}
                          className={`px-3 py-1.5 border transition-all ${
                            currentPage === totalPages
                              ? 'text-neutral-300 border-neutral-100 cursor-not-allowed'
                              : 'text-neutral-800 border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 font-bold'
                          }`}
                        >
                          NEXT &rarr;
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Right Column: Premium Curated Editorial Space */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* 1. LUXURY PARTNERSHIP: High-Class Editorial Advertisement */}
                <div className="border border-neutral-900 bg-neutral-950 text-white p-5 sm:p-6 shadow-[4px_4px_0px_0px_rgba(225,29,72,1)] space-y-4">
                  <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                    <span className="text-[8px] font-mono font-bold tracking-widest text-neutral-400 uppercase">■ PREMIUM PARTNERSHIP // AD</span>
                    <span className="text-[8px] font-mono text-rose-500 font-bold border border-rose-950/50 px-1.5 py-0.2">PROMOTION</span>
                  </div>
                  
                  <div className="relative aspect-[16/10] overflow-hidden border border-neutral-800 group cursor-pointer bg-neutral-900">
                    <img 
                      src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800"
                      alt="Premium Horology Watch"
                      className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-103 transition-all duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-neutral-950/20 group-hover:bg-transparent transition-all" />
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-serif italic font-black text-xs text-white uppercase tracking-wider">AETHER CHRONOMETER: THE MONOLITH</h4>
                    <p className="text-[10px] text-neutral-400 font-sans leading-relaxed">
                      지평을 가로지르는 시간의 물성. B 사이트 구독자만을 위한 스페셜 프라이빗 비스포크 커스텀 라인을 한정 수량 출시합니다.
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-neutral-900">
                    <span className="text-[8px] font-mono text-neutral-500">EXCLUSIVELY CURATED FOR SUNGBAE</span>
                    <span className="text-[9px] font-mono text-rose-500 font-bold hover:underline cursor-pointer">DETAILS →</span>
                  </div>
                </div>

                {/* 2. EDITION'S PICK: Highly Refined Spotlight Editorial Section */}
                {editorsPickPost && (
                  <div className="border border-neutral-900 bg-[#FAF9F6] p-5 sm:p-6 shadow-[3px_3px_0px_0px_rgba(23,23,23,1)] relative overflow-hidden group">
                    {/* Unique Top Ribbon */}
                    <div className="absolute top-0 right-0 bg-neutral-900 text-[#FAF9F6] text-[8px] font-mono font-black px-3 py-1.5 uppercase tracking-widest z-10">
                      ★ EDITION'S PICK
                    </div>
                    
                    <div className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono font-bold text-rose-600 uppercase tracking-wider bg-rose-50 border border-rose-100 px-1.5 py-0.2">
                            {editorsPickPost.category}
                          </span>
                          <span className="text-[9px] font-mono text-neutral-400">RECOMMENDED REPORT</span>
                        </div>
                        <h3 
                          onClick={() => {
                            setSelectedPost(editorsPickPost);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="font-serif font-black text-sm sm:text-base text-neutral-950 group-hover:text-rose-600 transition-colors leading-snug cursor-pointer line-clamp-2"
                        >
                          {editorsPickPost.title}
                        </h3>
                      </div>

                      {/* Distinct Portrait Aspect Ratio with Custom Styling */}
                      <div 
                        onClick={() => {
                          setSelectedPost(editorsPickPost);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="relative aspect-[4/3] w-full overflow-hidden border border-neutral-900 cursor-pointer bg-neutral-100"
                      >
                        <div className="absolute inset-0 bg-neutral-950/5 group-hover:bg-transparent transition-colors duration-500 z-10" />
                        <ImageGuard 
                          category={editorsPickPost.category}
                          postId={editorsPickPost.id}
                          src={editorsPickPost.imageUrl} 
                          alt={editorsPickPost.title}
                          className="w-full h-full object-cover grayscale contrast-110 group-hover:grayscale-0 group-hover:scale-103 transition-all duration-700 ease-out"
                        />
                      </div>

                      <p className="text-[11px] text-neutral-600 leading-relaxed font-sans line-clamp-3">
                        {editorsPickPost.excerpt}
                      </p>

                      <div className="border-t border-neutral-200 pt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-serif text-[10px] font-bold">
                            {editorsPickPost.author.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-mono font-bold text-neutral-800 uppercase">
                              {editorsPickPost.author}
                            </span>
                            <span className="text-[8px] font-mono text-neutral-400">
                              {editorsPickPost.createdAt}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => {
                            setSelectedPost(editorsPickPost);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="px-3 py-1 bg-neutral-900 hover:bg-rose-600 text-[#FAF9F6] text-[9px] font-mono font-bold tracking-wider transition-all duration-200"
                        >
                          READ ARTICLE
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. THE NEW REVOLUTION: Curated Insights Column */}
                <div className="border border-neutral-200 bg-white p-5 sm:p-6 space-y-4">
                  <div className="border-b border-neutral-200 pb-2">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-rose-600 uppercase">
                      ■ SPECIAL IN-DEPTH COGNITION
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="group cursor-pointer space-y-1.5">
                      <span className="text-[9px] font-mono text-neutral-400 tracking-wider">ISSUE #42</span>
                      <h4 className="font-serif font-bold text-xs sm:text-sm text-neutral-950 group-hover:text-rose-600 transition-colors">
                        인공일반지능(AGI)의 도래와 지적 권위의 분산화 현상
                      </h4>
                      <p className="text-[10px] text-neutral-500 line-clamp-2 leading-relaxed">
                        중앙 통제 시스템이 가공해 내는 오리지널 소스를 B 사이트가 미학적으로 해체하고 재조정하는 분산 저널리즘의 미래를 탐구합니다.
                      </p>
                    </div>

                    <div className="h-[1px] bg-neutral-100" />

                    <div className="group cursor-pointer space-y-1.5">
                      <span className="text-[9px] font-mono text-neutral-400 tracking-wider">ISSUE #41</span>
                      <h4 className="font-serif font-bold text-xs sm:text-sm text-neutral-950 group-hover:text-rose-600 transition-colors">
                        스마트 아일랜드와 하이엔드 인공지능 에코시스템의 수렴
                      </h4>
                      <p className="text-[10px] text-neutral-500 line-clamp-2 leading-relaxed">
                        초소켓 구조로 수신되는 순수 무결점의 가공 데이터를 기반으로 독자들에게 시각적 평안을 제시하는 종이 지면의 복원력을 추적합니다.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. PREMIUM NEWSLETTER: Minimalist Subscription Box */}
                <div className="border border-neutral-900 bg-[#171717] text-white p-5 sm:p-6 shadow-[3px_3px_0px_0px_rgba(225,29,72,1)] space-y-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-rose-500 tracking-widest uppercase font-bold block">
                      ■ MONOCLE TYPE SUBSCRIPTION
                    </span>
                    <h3 className="font-serif font-black text-sm sm:text-base leading-snug">
                      인텔리전스 에디토리얼을 매주 메일함으로 받아보세요.
                    </h3>
                  </div>
                  
                  <p className="text-[10px] text-neutral-400 leading-relaxed">
                    광고와 자극적인 헤드라인이 배제된, 매일 아침의 깊이 있는 오피니언과 특권층을 위한 분석 보고서를 송신합니다.
                  </p>

                  <div className="space-y-2 pt-1">
                    <input 
                      type="email" 
                      placeholder="YOUR_EMAIL@DOMAIN.COM"
                      className="w-full bg-neutral-800 border border-neutral-700 p-2 text-[10px] text-white focus:outline-none focus:border-rose-500 font-mono rounded-none"
                    />
                    <button 
                      onClick={() => alert('프리미엄 정기구독 신청이 완료되었습니다. (B SITE EXCLUSIVE)')}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-mono font-bold tracking-wider transition-all"
                    >
                      REQUEST SUBSCRIPTION
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </main>

          {/* Premium Footer */}
          <footer className="border-t-4 border-neutral-900 bg-white py-8 mt-16 text-neutral-500 text-xs font-mono">
            <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="space-y-1 text-center md:text-left">
                <span className="font-serif font-bold text-base text-neutral-950 block">소소한 웹진</span>
                <p className="max-w-md text-neutral-400 font-sans leading-relaxed text-[10px]">
                  본 서비스는 로그인 없이 누구에게나 공개된 프리미엄 지식 아카이브입니다. 
                  모든 게시글은 소소한 웹진 파이어베이스 DB를 통해 수집되며, 모던 에디토리얼 방식으로 배치됩니다.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-6 text-neutral-600">
                <a href="#webzine-list" className="hover:text-neutral-950 hover:underline">Top</a>
                <span className="text-neutral-300">|</span>
                <span className="text-neutral-400">© 2026 Soso Webzine. All Rights Reserved.</span>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

