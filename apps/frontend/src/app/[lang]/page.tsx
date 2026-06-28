import { fetchUser, fetchExperience, fetchEducation, fetchProjects, fetchSkills } from "@/lib/api";
import { getDictionary } from "@/get-dictionary";
import { Locale } from "@/i18n-config";
import JourneyTimeline from "@/components/JourneyTimeline";
import HeroScrollSection from "@/components/HeroScrollSection";
import SkillsScrollSection from "@/components/SkillsScrollSection";
import WorksScrollSection from "@/components/WorksScrollSection";
import ContactScrollSection from "@/components/ContactScrollSection";
import { userConfig } from "@/lib/userConfig";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;

  const [dict, user, experiences, educations, skills, projectsRes] = await Promise.all([
    getDictionary(lang),
    fetchUser(undefined, lang),
    fetchExperience(undefined, lang),
    fetchEducation(undefined, lang),
    fetchSkills(undefined),
    fetchProjects(undefined, { highlighted: true, limit: 5 }, lang),
  ]);

  const highlightedProjects = projectsRes.data;

  const socialUrls = userConfig.socialMedias.map(sm => sm.split('|')[1]);

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": user?.name || userConfig.name,
    "email": userConfig.email,
    "jobTitle": user?.role || dict.profile.role,
    "description": user?.description || dict.profile.description,
    "url": `https://andikas.dev/${lang}`,
    "image": user?.profilePhoto || userConfig.profilePhoto,
    "sameAs": socialUrls,
  };

  return (
    <div className="flex flex-col items-center w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />

      {/* Hero Section (Scroll-pinned & split text) */}
      <HeroScrollSection
        description={user?.description || dict.profile.description}
        role={user?.role || dict.profile.role}
        profilePhoto={user?.profilePhoto || userConfig.profilePhoto}
        name={user?.name || userConfig.name}
        location={user?.location || "INDONESIA"}
      />

      {/* Skills Section (Scroll-pinned horizontal marquee) */}
      <SkillsScrollSection
        skills={skills}
        title={dict.home.skills}
      />

      {/* My Journey Section (Vertical scroll-revealed timeline) - Hidden for now
      <section id="journey" className="w-4/5 mx-auto px-6 py-32 flex flex-col items-start snap-section">
        <span className="text-[10px] font-bold text-brand-900 tracking-[0.25em] uppercase mb-6 block">
          HISTORY
        </span>
        <h2 className="text-3xl md:text-5xl font-bold mb-16 tracking-tight uppercase text-neutral-900">
          {dict.home.journey}
        </h2>

        <JourneyTimeline
          educations={educations}
          experiences={experiences}
        />
      </section>
      */}

      {/* Selected Works Section (Scroll-pinned horizontal translation) */}
      <WorksScrollSection
        projects={highlightedProjects}
        title={dict.home.selectedWorks}
        seeAllWorksText={dict.home.seeAllWorks}
        lang={lang}
      />

      {/* Let's Talk Section (Scroll-pinned Outro with converged text and giant scaling dot) */}
      <ContactScrollSection
        dict={dict}
      />
    </div>
  );
}
