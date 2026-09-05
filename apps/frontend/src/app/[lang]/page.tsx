import { fetchUser, fetchProjects, fetchSkills } from "@/lib/api";
import { getDictionary } from "@/get-dictionary";
import { Locale } from "@/i18n-config";
import { HeroSection } from "@/components/HeroSection";
import { SkillsSection } from "@/components/SkillsSection";
import { WorksSection } from "@/components/WorksSection";
import { userConfig } from "@/lib/userConfig";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;

  const [dict, user, skills, projectsRes] = await Promise.all([
    getDictionary(lang),
    fetchUser(undefined, lang),
    fetchSkills(undefined),
    fetchProjects(undefined, { highlighted: true, limit: 5 }, lang),
  ]);

  const highlightedProjects = projectsRes.data;
  const socialUrls = userConfig.socialMedias.map((sm) => sm.split("|")[1]);

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: user?.name || userConfig.name,
    email: userConfig.email,
    jobTitle: user?.role || dict.profile.role,
    description: user?.description || dict.profile.description,
    url: `https://andikas.dev/${lang}`,
    image: user?.profilePhoto || userConfig.profilePhoto,
    sameAs: socialUrls,
  };

  return (
    <div className="flex flex-col items-center w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />

      <HeroSection
        name={user?.name || userConfig.name}
        description={user?.description || dict.profile.description}
        profilePhoto={user?.profilePhoto || userConfig.profilePhoto}
        email={userConfig.email}
        socialMedias={userConfig.socialMedias}
        noImageText={dict.common?.noImage || "no image"}
      />

      <SkillsSection
        skills={skills}
        title={dict.home.skills || "skills"}
      />

      <WorksSection
        projects={highlightedProjects}
        lang={lang}
        title={dict.home.selectedWorks || "works"}
        seeAllText={`${dict.home.seeAllWorks || "see all"} →`}
        noImageText={dict.common?.noImage || "no image"}
      />
    </div>
  );
}
