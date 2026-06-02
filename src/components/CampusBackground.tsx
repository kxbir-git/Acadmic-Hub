import campus from "@/assets/iu-bg.jpg";

export function CampusBackground() {
  return (
    <div
      aria-hidden
      className="bg-campus"
      style={{ ["--campus-image" as string]: `url(${campus})` }}
    />
  );
}
