import { IProjectExperience } from "./experience";

/** Base shape shared by every profile section descriptor. */
export interface ISectionInfo {
  /** Section title. */
  title: string;
  /** Optional ref id used for in-page navigation. */
  ref?: string;
  /** Optional icon identifier. */
  icon?: string;
}

/** "About me" section descriptor with prose info. */
export interface IAboutMeInfo extends ISectionInfo {
  /** Free-form info text. */
  info: string;
}

/** Contact-detail attribute types in the about-me details list. */
export type AboutMeDetailType = "email" | "mobile" | "location";

/** Section listing copyable contact details. */
export interface IDetailInfo extends ISectionInfo {
  /** Detail rows. */
  info: {
    /** Detail kind. */
    id: AboutMeDetailType;
    /** Display label. */
    label: string;
    /** Display value. */
    info: string;
    /** Whether the value is copyable to clipboard. */
    canCopy?: boolean;
  }[];
}

/** A single skill entry with a star rating. */
export interface ISkill {
  /** Skill label. */
  label: string;
  /** Star rating (e.g. 1-5). */
  star: number;
}

/** Section listing skills. */
export interface ISkillInfo extends ISectionInfo {
  /** Skill rows. */
  info: ISkill[];
}

/** A work-experience entry for an organization. */
export interface IExperience {
  /** Organization name. */
  name: string;
  /** Engagement type (e.g. full-time, contract). */
  type: string;
  /** Start date (display string). */
  from: string;
  /** End date (display string), if applicable. */
  to?: string;
  /** Designation at the organization. */
  designation: string;
  /** Responsibilities summary. */
  responsibilities: string;
  /** Projects executed during this experience. */
  projects: IProjectExperience[];
}

/** Section listing work experiences. */
export interface IExperienceInfo extends ISectionInfo {
  /** Experience rows. */
  info: IExperience[];
}

/** Education section descriptor (same shape as about-me). */
export interface IEducationInfo extends IAboutMeInfo {}

/** External link types supported by the profile. */
export type LinkType =
  | "whatsApp"
  | "github"
  | "facebook"
  | "linkedIn"
  | "twitter";

/** A single external/social link. */
export interface ILink {
  /** Target URL. */
  link: string;
  /** Link kind. */
  label: LinkType;
  /** Whether the link should be displayed. */
  display?: boolean;
}

/** Section listing external links. */
export interface ILinkInfo extends ISectionInfo {
  /** Link rows. */
  info: ILink[];
}

/** A single open-source project entry. */
export interface IOpenSource {
  /** Stable identifier. */
  id: string;
  /** Project title. */
  title: string;
  /** Optional npm package name. */
  npm?: string;
  /** GitHub URL or slug. */
  github: string;
  /** Skills/tech used (display string). */
  skillsUsed: string;
  /** Project description. */
  description: string;
}

/** Section listing open-source projects. */
export interface IOpenSourceInfo extends ISectionInfo {
  /** Open-source project rows. */
  info: IOpenSource[];
}

/** All profile sections keyed by section name. */
export interface ISections {
  /** About-me section. */
  aboutMe: IAboutMeInfo;
  /** Contact details section. */
  details: IDetailInfo;
  /** Skills section. */
  skills: ISkillInfo;
  /** Experiences section. */
  experiences: IExperienceInfo;
  /** Education section. */
  education: IEducationInfo;
  /** Links section. */
  links: ILinkInfo;
  /** Open-source projects section. */
  openSourceProjects: IOpenSourceInfo;
}

/** Union of profile section identifiers. */
export type ProfileSectionType =
  | "aboutMe"
  | "details"
  | "skills"
  | "experiences"
  | "education"
  | "links"
  | "openSourceProjects";

/** Map of section identifier to section descriptor. */
export type SectionsType = {
  [key in ProfileSectionType]: ISectionInfo;
};
