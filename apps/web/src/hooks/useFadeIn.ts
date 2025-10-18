"use client";
import { useEffect } from "react";

export default function useFadeIn(selector: string, delay = 0) {
  useEffect(() => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el, i) => {
      setTimeout(() => {
        el.classList.add("fade-in");
      }, delay + i * 200);
    });
  }, [selector, delay]);
}
