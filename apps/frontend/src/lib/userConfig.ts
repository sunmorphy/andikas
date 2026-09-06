import { getMediaUrl } from "./media";

export const userConfig = {
  name: "Andika Sultanrafli",
  email: "hello@andikas.dev",
  phone: "+62 896-1206-9998",
  profilePhoto: getMediaUrl("img_20251129_164332-cropped_20260410.webp", "users"),
  resume: getMediaUrl("andikas-resume_20260326.pdf", "users"),
  socialMedias: [
    "github-logo|https://github.com/sunmorphy",
    "linkedin-logo|https://linkedin.com/in/andika-sultan"
  ]
};
