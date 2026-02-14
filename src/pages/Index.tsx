import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { LatestVideos } from "@/components/home/LatestVideos";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { DiscordCTA } from "@/components/home/DiscordCTA";
import { ParticleBackground } from "@/components/effects/ParticleBackground";

const Index = () => {
  return (
    <Layout>
      <ParticleBackground />
      <HeroSection />
      <FeaturesSection />
      <LatestVideos />
      <DiscordCTA />
      <NewsletterSection />
    </Layout>
  );
};

export default Index;
