import type { Metadata } from "next";
import { Navbar } from "./(marketing)/components/Navbar";
import { HeroSection } from "./(marketing)/components/HeroSection";
import { HowItWorks } from "./(marketing)/components/HowItWorks";
import { AgentWorkspace } from "./(marketing)/components/AgentWorkspace";
import { UseCases } from "./(marketing)/components/UseCases";
import { FeatureGrid } from "./(marketing)/components/FeatureGrid";
import { GetStarted } from "./(marketing)/components/GetStarted";
import { FaqAccordion } from "./(marketing)/components/FaqAccordion";
import { Footer } from "./(marketing)/components/Footer";

export const metadata: Metadata = {
  title: "Vessel: an AI agent that uses a computer like you do",
  description:
    "Open-source dashboard where Claude controls a sandboxed Linux desktop from plain-English tasks. Built with Next.js, AWS Bedrock, and Vercel Sandbox.",
  openGraph: {
    title: "Vessel",
    description: "Describe a task. Watch an AI agent do it on a live Linux desktop.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased selection:text-white">
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorks />
        <AgentWorkspace />
        <UseCases />
        <FeatureGrid />
        <GetStarted />
        <FaqAccordion />
      </main>
      <Footer />
    </div>
  );
}