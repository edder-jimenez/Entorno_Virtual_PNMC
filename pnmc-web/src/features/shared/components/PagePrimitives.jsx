import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { scrollToElementWithOffset } from '../../map/domain/mapDomain.js';

const Tag = ({ text, className = '' }) => ( 
  <span className={`text-[0.7rem] inline-block font-bold px-5 py-2 rounded-md uppercase font-alternate tracking-[0.12em] ${className}`}> 
    {text} 
  </span> 
); 

const SectionHeader = ({ backgroundText, foregroundText, verticalContext, compact = false }) => ( 
  <div className={`relative ${compact ? 'mb-4 lg:mb-6' : 'mb-8 lg:mb-12'} w-full text-left group`}> 
    {verticalContext && ( 
      <div className={`hidden xl:flex absolute -left-14 ${compact ? 'top-6' : 'top-8'} -rotate-90 origin-top-left items-center gap-3 text-slate-300 opacity-40 group-hover:opacity-100 transition-opacity duration-500`}> 
        <span className="text-[0.5rem] font-bold uppercase font-alternate tracking-[0.4em] whitespace-nowrap"> 
          {verticalContext} 
        </span> 
        <div className="w-10 h-px bg-slate-200"></div> 
      </div> 
    )} 
    <div className="relative inline-block">
      <div  
        className="font-gregor text-[4.5rem] lg:text-[8rem] select-none opacity-5 leading-none tracking-tight pointer-events-none text-left" 
        style={{ color: '#291242' }}  
      > 
        {backgroundText} 
      </div> 
      <div className="absolute bottom-0 left-0 z-10 flex items-end gap-3 md:gap-4 text-left whitespace-nowrap">
        <h2 className="font-gregor text-[#291242] uppercase tracking-tighter leading-none text-3xl lg:text-5xl"> 
          {foregroundText} 
        </h2> 
        <div className="w-8 lg:w-12 h-1.5 bg-[#8BF784] rounded-full mb-1 opacity-80 group-hover:w-24 transition-all duration-500"></div> 
      </div> 
    </div> 
  </div> 
); 

const ContentWrapper = ({
  children,
  className = '',
  id = '',
  fullBleed = false,
  innerClassName = '',
}) => ( 
  <section id={id} className={`py-12 md:py-16 scroll-mt-24 ${className}`}> 
    <div className={fullBleed ? innerClassName : `max-w-[100rem] mx-auto px-6 lg:px-8 ${innerClassName}`}> 
      {children} 
    </div> 
  </section> 
); 

const TwoToneLineTitle = ({ text = '', className = '' }) => {
  const containerRef = useRef(null);
  const [lines, setLines] = useState(() => [text]);
  const words = useMemo(
    () => String(text || '').trim().split(/\s+/).filter(Boolean),
    [text],
  );

  const buildLines = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const wordNodes = Array.from(container.querySelectorAll('[data-line-word="true"]'));
    if (wordNodes.length === 0) {
      setLines([text]);
      return;
    }

    const grouped = [];
    let currentTop = null;

    wordNodes.forEach((node) => {
      const nodeTop = node.offsetTop;
      const nodeText = (node.textContent || '').trim();

      if (!nodeText) return;

      if (currentTop === null || Math.abs(nodeTop - currentTop) > 1) {
        grouped.push([nodeText]);
        currentTop = nodeTop;
        return;
      }

      grouped[grouped.length - 1].push(nodeText);
    });

    const normalizedLines = grouped.map((lineWords) => lineWords.join(' ')).filter(Boolean);
    setLines(normalizedLines.length > 0 ? normalizedLines : [text]);
  }, [text]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const animationFrameId = window.requestAnimationFrame(() => {
      buildLines();
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [buildLines, words.length]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(() => {
      buildLines();
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [buildLines]);

  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts?.ready) return undefined;

    let isActive = true;
    document.fonts.ready.then(() => {
      if (isActive) buildLines();
    });

    return () => {
      isActive = false;
    };
  }, [buildLines]);

  const whiteLineCount = Math.ceil(lines.length / 2);

  return (
    <div ref={containerRef} className="relative w-full">
      <h1 className={className}>
        {lines.map((lineText, index) => (
          <span
            key={`${lineText}-${index}`}
            className={`block ${index < whiteLineCount ? 'text-white' : 'text-[#00DA5E]'}`}
          >
            {lineText}
          </span>
        ))}
      </h1>

      <div aria-hidden className={`invisible pointer-events-none absolute inset-0 -z-10 ${className}`}>
        {words.map((word, index) => (
          <span key={`${word}-${index}`} data-line-word="true">
            {word}
            {index < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    </div>
  );
};

const PageHero = ({ title, titleAccent, description, bgImage, onBack, children, childrenPosition = 'default', visualContent, fullScreen = false, compactNews = false, backOnly = false, scrollTargetRef, bgImageClassName = '', titleClassName = '', titleTone = 'default' }) => {
  const handleScroll = () => {
    if (scrollTargetRef?.current) {
      scrollToElementWithOffset(scrollTargetRef.current);
    }
  };

  return (
    <header className={`relative ${fullScreen ? 'h-[100svh]' : backOnly ? 'min-h-[16rem]' : compactNews ? 'min-h-[55vh]' : 'min-h-[70vh]'} flex items-center overflow-hidden bg-[#291242] ${backOnly ? 'pt-20 pb-6 lg:pt-28 lg:pb-8' : compactNews ? 'pt-16 pb-8 lg:pt-24 lg:pb-10' : 'pt-20 pb-10 lg:pt-28 lg:pb-14'} text-left`}> 
      <div className="absolute inset-0 z-0"> 
        <img src={bgImage} alt="" className={`w-full h-full object-cover grayscale opacity-28 transition-all duration-1000 ${fullScreen ? 'object-center scale-[1.18] md:scale-[1.1]' : 'object-center'} ${bgImageClassName}`} /> 
        <div className="absolute inset-0 bg-[#291242]/62 mix-blend-multiply z-10" /> 
        <div className="absolute inset-0 bg-gradient-to-t from-[#291242] via-transparent to-transparent z-10" /> 
      </div> 
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 lg:px-8"> 
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center"> 
          <div className="lg:col-span-7 space-y-6 md:space-y-8"> 
            <div className={`space-y-6 ${backOnly ? 'max-w-fit' : ''}`}> 
              <div className="flex flex-col items-start gap-3">
                {onBack && ( 
                  <button onClick={onBack} className="inline-flex items-center gap-2 text-[0.55rem] font-bold text-[#8BF784] hover:text-white transition-all uppercase font-alternate group tracking-widest"> 
                    <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> VOLVER 
                  </button> 
                )} 
              </div>
            </div> 
            {!backOnly && (
              <>
                {titleTone === 'split-lines' ? (
                  <TwoToneLineTitle
                    text={[title, titleAccent].filter(Boolean).join(' ')}
                    className={`${compactNews ? 'text-3xl sm:text-4xl lg:text-6xl' : 'text-4xl sm:text-5xl lg:text-7xl'} font-gregor leading-[1.1] uppercase tracking-tighter drop-shadow-xl ${titleClassName}`.trim()}
                  />
                ) : (
                  <h1 className={`${compactNews ? 'text-3xl sm:text-4xl lg:text-6xl' : 'text-4xl sm:text-5xl lg:text-7xl'} font-gregor text-white leading-[1.1] uppercase tracking-tighter drop-shadow-xl ${compactNews && !titleAccent ? 'max-w-4xl line-clamp-2' : ''} ${titleClassName}`.trim()}> 
                    {title}
                    {titleAccent && (
                      <>
                        <br/>
                        <span className="text-[#00DA5E] italic">{titleAccent}</span>
                      </>
                    )} 
                  </h1>
                )}
                <p className="font-nunito text-sm md:text-base lg:text-lg text-slate-300 font-light leading-relaxed max-w-xl border-l border-[#8BF784]/30 pl-5"> 
                  {description} 
                </p>
              </>
            )}
            {!backOnly && childrenPosition !== 'bottom-right' && (
              <div className="flex flex-wrap gap-4">
                {children}
              </div>
            )}
          </div> 
          {!backOnly && visualContent && (
            <div className="lg:col-span-5 relative hidden md:block"> 
              {visualContent} 
            </div>
          )}
        </div> 
      </div> 
      {childrenPosition === 'bottom-right' && children && (
        <div className="absolute bottom-10 right-6 lg:right-12 z-30">
          {children}
        </div>
      )}
      {fullScreen && (
        <button 
          onClick={handleScroll}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 animate-bounce hover:opacity-70 transition-opacity cursor-pointer"
        >
          <ChevronDown className="text-[#8BF784]" size={32} />
        </button>
      )}
    </header> 
  );
};


export {
  Tag,
  SectionHeader,
  ContentWrapper,
  TwoToneLineTitle,
  PageHero,
};
