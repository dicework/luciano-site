export function PageHeading({
  eyebrow,
  title,
  accent,
  description,
}: {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
}) {
  return (
    <div className="page-heading wrap">
      <p className="eyebrow">{eyebrow}</p>
      <h1>
        {title} <em>{accent}</em>
      </h1>
      <p className="page-description">{description}</p>
    </div>
  );
}
