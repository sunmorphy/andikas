import { Skill } from "@andikas/types";
import { SectionHeading } from "./ui/SectionHeading";
import { SlashList } from "./ui/SlashList";

interface Props {
  skills: Skill[];
  title?: string;
}

export function SkillsSection({ skills, title = "skills" }: Props) {
  const skillNames = skills.map((s) => s.name);

  return (
    <section id="skills" className="w-full max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24">
      <SectionHeading title={title} className="mb-8 md:mb-12" />
      <SlashList
        items={skillNames}
        className="max-w-5xl"
        itemClassName="text-xl md:text-2xl font-bold"
        slashClassName="text-xl md:text-2xl"
      />
    </section>
  );
}
