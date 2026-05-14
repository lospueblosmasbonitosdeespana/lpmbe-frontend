'use client'

import { ChevronLeft, ChevronRight, MapPin, Star, Play } from 'lucide-react'
import { useState } from 'react'

export function HeroVideo() {
  const [currentSlide, setCurrentSlide] = useState(0)

  return (
    <section className="relative h-[92vh] w-full overflow-hidden">
      {/* Background Image with Ken Burns */}
      <div className="absolute inset-0 animate-kenburns">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/images/activity-hero.jpg)',
          }}
        />
      </div>

      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, var(--color-slate) 0%, transparent 60%)',
        }}
      />

      {/* Play Button Overlay */}
      <button 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full flex items-center justify-center transition-transform hover:scale-110"
        style={{ 
          backgroundColor: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(10px)',
        }}
        aria-label="Reproducir video"
      >
        <Play className="w-8 h-8 text-white ml-1" fill="white" />
      </button>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16">
        <div className="max-w-7xl mx-auto">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span 
              className="px-4 py-1.5 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--color-adventure)' }}
            >
              Aventura y Naturaleza
            </span>
            <span 
              className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                color: 'white',
              }}
            >
              <img src="/images/lpmbe-shield.svg" alt="LPMBE" className="w-4 h-4" />
              Club LPMBE
            </span>
          </div>

          {/* Title */}
          <h1 
            className="font-serif text-4xl md:text-5xl lg:text-7xl text-white font-bold mb-4 text-balance max-w-4xl"
          >
            Sobrarbe Aventura
          </h1>

          {/* Tagline */}
          <p 
            className="font-serif italic text-lg md:text-xl mb-6 max-w-2xl"
            style={{ color: 'rgba(255,255,255,0.8)' }}
          >
            Descubre la magia del Pirineo aragonés con experiencias guiadas que conectan con la naturaleza
          </p>

          {/* Location & Rating */}
          <div className="flex flex-wrap items-center gap-4 text-white">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span>Aínsa, Huesca</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className="w-4 h-4" 
                  fill={i < 5 ? 'var(--color-ember)' : 'transparent'}
                  style={{ color: 'var(--color-ember)' }}
                />
              ))}
              <span className="ml-1">4.9 (89 reseñas)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{ 
          backgroundColor: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)',
        }}
        aria-label="Anterior"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button
        onClick={() => setCurrentSlide(prev => prev + 1)}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{ 
          backgroundColor: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)',
        }}
        aria-label="Siguiente"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>
    </section>
  )
}

export default HeroVideo
