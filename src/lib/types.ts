export type NavItem = {
  label: string;
  href: string;
};

export type SourceLink = {
  title: string;
  href: string;
  description: string;
  kind: "official" | "reference";
};

export type ProviderPreview = {
  name: string;
  modelSlug: string;
  directoryUrl: string;
  status: "live";
};

export type FaqItem = {
  question: string;
  answer: string;
};
