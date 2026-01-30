import { ExternalLink } from "lucide-react";

const projects = [
  { name: "Coaching", url: "https://zangerlcoachingdynamics.com" },
  { name: "PageTopic", url: "https://pagetopic.org" },
  { name: "Neurohacking", url: "https://neurohackingly.com" },
  { name: "Produktivität", url: "https://die-produktivitaets-werkstatt.com" },
];

export function MakerFooter() {
  return (
    <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm text-muted-foreground">
        <span>A product by Lukas</span>
        <span className="hidden sm:inline">•</span>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {projects.map((project) => (
            <a
              key={project.name}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-primary transition-colors"
            >
              {project.name}
              <ExternalLink className="w-3 h-3" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
