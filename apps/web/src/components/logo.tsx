"use client";

interface LogoProps {
  src?: string;
  alt?: string;
  className?: string;
}

export default function Logo({ src = "/logo.png", alt = "Copa Uva", className = "" }: LogoProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={`w-40 md:w-48 fade-in ${className}`}
    />
  );
}
