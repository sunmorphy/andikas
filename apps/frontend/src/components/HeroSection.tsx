import Image from "next/image";
import { getMediaUrl } from "@/lib/media";
import { UnderlineLink } from "./ui/UnderlineLink";

interface Props {
  description: string;
  name: string;
  profilePhoto: string | null;
  email: string;
  socialMedias: string[];
  noImageText?: string;
}

export function HeroSection({
  description,
  name,
  profilePhoto,
  email,
  socialMedias,
  noImageText = "no image",
}: Props) {
  const photoUrl = getMediaUrl(profilePhoto);
  const nameParts = name.trim().split(" ");
  const firstName = nameParts[0] || "andika";
  const restOfName = nameParts.slice(1).join(" ") || "sultanrafli";

  return (
    <section className="w-full max-w-7xl mx-auto px-6 md:px-12 pt-8 md:pt-16 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 xl:gap-20 items-start">
        <div className="lg:col-span-7 flex flex-col items-start">
          <h1 className="text-[clamp(3.2rem,6.2vw,6.5rem)] font-bold tracking-tighter leading-[0.9] text-ink lowercase select-none">
            <span className="block">{firstName.toLowerCase()}</span>
            <span className="block">{restOfName.toLowerCase()}</span>
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12 mt-10 md:mt-14 w-full max-w-xl">
            <p className="text-xs md:text-sm text-ink leading-relaxed font-normal">
              {description}
            </p>

            <div className="flex flex-col items-start gap-2 text-xs md:text-sm font-bold lowercase text-ink">
              <UnderlineLink href={`mailto:${email}`}>
                {email.toLowerCase()}
              </UnderlineLink>

              {socialMedias.map((social) => {
                const parts = social.split("|");
                const url = parts[1] || parts[0];
                const display = url
                  .replace(/^https?:\/\//i, "")
                  .replace(/^www\./i, "");

                return (
                  <UnderlineLink key={url} href={url} external>
                    {display.toLowerCase()}
                  </UnderlineLink>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-start lg:justify-end w-full pt-1">
          <div className="relative w-64 md:w-72 lg:w-80 xl:w-[22rem] aspect-square bg-neutral-200/40 overflow-hidden">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={name}
                fill
                priority
                sizes="(max-width: 768px) 256px, (max-width: 1024px) 320px, 384px"
                className="object-cover object-top filter grayscale contrast-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-ink/40 lowercase">
                {noImageText.toLowerCase()}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
