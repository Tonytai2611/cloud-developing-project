import React from 'react';
import Hero from '../components/home/Hero';
import ExperienceStrip from '../components/home/ExperienceStrip';
import IntroductionComponent from '../components/home/IntroductionComponent';

export default function Home() {
  return (
    <div>
      <Hero />
      <ExperienceStrip />
      <IntroductionComponent />
    </div>
  );
}
