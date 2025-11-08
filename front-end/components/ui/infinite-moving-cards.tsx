"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import React, { useEffect, useState } from "react";

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
  onImageClick,
  disabled = false,
}: {
  items: {
    src: string;
    alt: string;
  }[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
  onImageClick?: (item: { src: string; alt: string }) => void;
  disabled?: boolean;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLUListElement>(null);
  const [start, setStart] = useState(false);

  function addAnimation() {
    if (containerRef.current && scrollerRef.current) {
      // Clear existing cloned items first
      const scrollerContent = Array.from(scrollerRef.current.children);
      const originalItemsCount = items.length;
      
      // Remove any previously cloned items
      while (scrollerRef.current.children.length > originalItemsCount) {
        scrollerRef.current.removeChild(scrollerRef.current.lastChild!);
      }

      // Clone items for infinite scroll
      const itemsToDuplicate = Array.from(scrollerRef.current.children);
      itemsToDuplicate.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        if (scrollerRef.current) {
          scrollerRef.current.appendChild(duplicatedItem);
        }
      });

      getDirection();
      getSpeed();
      setStart(true);
    }
  }

  useEffect(() => {
    addAnimation();
  }, []);
  
  // Re-initialize when items change or disabled state changes
  useEffect(() => {
    if (scrollerRef.current && !disabled) {
      addAnimation();
    }
  }, [disabled]);
  const getDirection = () => {
    if (containerRef.current) {
      if (direction === "left") {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "forwards",
        );
      } else {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "reverse",
        );
      }
    }
  };
  const getSpeed = () => {
    if (containerRef.current) {
      if (speed === "fast") {
        containerRef.current.style.setProperty("--animation-duration", "20s");
      } else if (speed === "normal") {
        containerRef.current.style.setProperty("--animation-duration", "40s");
      } else {
        containerRef.current.style.setProperty("--animation-duration", "80s");
      }
    }
  };

  // Update speed CSS variable when prop changes
  useEffect(() => {
    getSpeed();
  }, [speed]);

  // Update direction CSS variable when prop changes
  useEffect(() => {
    getDirection();
  }, [direction]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 max-w-7xl overflow-hidden mask-[linear-gradient(to_right,transparent,white_20%,white_80%,transparent)] group",
        className,
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex w-max min-w-full shrink-0 flex-nowrap gap-4 py-4",
          start && "animate-scroll",
        )}
      >
        {items.map((item, idx) => (
          <li
            className="relative w-[350px] max-w-full shrink-0 rounded-2xl md:w-[450px] group"
            key={idx}
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl">
              <Image
                src={item.src}
                alt={item.alt}
                fill
                className="object-cover transition-all group-hover:brightness-75"
              />
              
              {/* Memorise Button - Shows on Hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => !disabled && onImageClick?.(item)}
                  disabled={disabled}
                  className="px-6 py-3 bg-white text-gray-900 rounded-full font-medium shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Memorise
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

