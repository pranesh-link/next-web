/** Short, single-value attributes shown for a project experience. */
export type ShortInfosType = "client" | "duration" | "role" | "softwareTech";

/** Attributes for a project experience that can be expanded/collapsed in the UI. */
export type ExpandableInfosType = "description";

/** A single project entry inside an organization's experience block. */
export interface IProjectExperience {
  /** Full project title. */
  title: string;
  /** Short title used in compact UI surfaces. */
  shortTitle: string;
  /** Client/customer name. */
  client: string;
  /** Project duration (display string). */
  duration: string;
  /** Role played on the project. */
  role: string;
  /** Comma-separated software/technology stack used. */
  softwareTech: string;
  /** Long-form project description. */
  description: string;
  /** External links related to the project. */
  links: string[];
}

/** Lightweight reference to an experience entry, used for jump links. */
export interface IExperienceJsonInfo {
  /** DOM/section ref id. */
  ref: string;
  /** Display name. */
  name: string;
}

/** Resume-formatted block grouping organizations under a title. */
export interface IResumeExperience {
  /** Section title. */
  title: string;
  /** Organization entries. */
  info: IResumeOrg[];
}

/** Resume-formatted organization entry. */
export interface IResumeOrg {
  /** Organization name. */
  organization: string;
  /** Responsibilities summary. */
  responsibilities: string;
  /** Designation/role at the organization. */
  designation: string;
  /** Duration display string. */
  duration: string;
  /** Project entries within the organization. */
  projects: {
    /** Project title. */
    title: string;
    /** Client name. */
    client: string;
    /** Related links. */
    links: string[];
  }[];
}

/** Grouping of projects under an organization. */
export interface IOrgProject {
  /** Organization name. */
  organization: string;
  /** Projects belonging to the organization. */
  projects: IProject[];
}

/** Generic project map keyed by attribute name. */
export interface IProject {
  [key: string]: {
    /** Display info string. */
    info: string;
    /** Whether this entry needs a show/hide toggle in the UI. */
    requiresShowHide?: boolean;
  };
}
