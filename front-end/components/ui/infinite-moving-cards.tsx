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

  // Double the items array for infinite scroll (React handles event binding)
  const duplicatedItems = [...items, ...items];

  useEffect(() => {
    getDirection();
    getSpeed();
  }, []);
  
  // Update animation when direction or speed changes
  useEffect(() => {
    getDirection();
  }, [direction]);

  useEffect(() => {
    getSpeed();
  }, [speed]);
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

  return (
    <div className="relative h-full w-full">
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
            "flex w-max min-w-full shrink-0 flex-nowrap gap-4 animate-scroll",
          )}
        >
          {duplicatedItems.map((item, idx) => (
            <li
              className="group relative w-[260px] max-w-full shrink-0 sm:w-[300px] md:w-[340px] lg:w-[380px]"
              key={`${item.src}-${idx}`}
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl">
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 639px) 260px, (max-width: 767px) 300px, (max-width: 1023px) 340px, 380px"
                  className="object-cover transition-all group-hover:brightness-75"
                />

                {/* Memorise Button - Shows on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <button
                    onClick={() => !disabled && onImageClick?.(item)}
                    disabled={disabled}
                    className="rounded-full bg-white px-6 py-3 font-medium text-gray-900 shadow-lg transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Recall
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

