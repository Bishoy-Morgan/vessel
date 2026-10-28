"use client";

import { useEffect, useRef } from "react";

export function DemoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoNode = videoRef.current;
    if (!videoNode) return;

    // IntersectionObserver plays video when scrolled into view and pauses when out
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoNode.play().catch(() => {
              // Handle potential browser autoplay policy restrictions silently
            });
          } else {
            videoNode.pause();
          }
        });
      },
      { threshold: 0.3 } // Triggers when 30% of the video is visible
    );

    observer.observe(videoNode);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section id="demo" className="scroll-mt-16 py-20 border-b border-border bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-sans">
            A real run
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Recorded from the live dashboard: one browser task and one terminal task.
          </p>
        </div>

        <div className="relative rounded-xl border border-border bg-card shadow-2xl shadow-primary/5 overflow-hidden group">
          <video
            ref={videoRef}
            className="w-full h-auto block bg-black"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          >
            <source src="/demo.mp4#t=0.1" type="video/mp4" />
            Your browser doesn&apos;t support video.{" "}
            <a href="/demo.mp4" className="underline text-primary">
              Open the demo video
            </a>
            .
          </video>
        </div>

        <p className="mt-4 text-center text-sm font-mono text-muted-foreground">
          Prompts: &ldquo;Find the top trending TypeScript repo&rdquo; and &ldquo;Inspect the system
          in a terminal&rdquo;.
        </p>
      </div>
    </section>
  );
}