'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Scroll Back to Top Visibility
    function handleScroll() {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }
    window.addEventListener('scroll', handleScroll);

    // 2. Scroll Reveal Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => observer.observe(el));

    // 3. Navbar link click animations and target highlights
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    
    const handleNavClick = (e: Event) => {
      const targetId = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
      if (!targetId) return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: 'smooth' });
        
        // Trigger section flash animation
        targetElement.classList.add('nav-highlight');
        
        // Trigger nav link bounce feedback
        const link = e.currentTarget as HTMLElement;
        link.classList.add('scale-click');
        setTimeout(() => {
          link.classList.remove('scale-click');
        }, 200);

        setTimeout(() => {
          targetElement.classList.remove('nav-highlight');
        }, 1400);
      }
    };

    navLinks.forEach((link) => link.addEventListener('click', handleNavClick));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      elements.forEach((el) => observer.unobserve(el));
      navLinks.forEach((link) => link.removeEventListener('click', handleNavClick));
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 bg-[#FFE066] text-black border-[2.5px] border-black p-3.5 shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer rounded-none group"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5 stroke-[3px] group-hover:-translate-y-0.5 transition-transform duration-200" />
        </button>
      )}
    </>
  );
}
