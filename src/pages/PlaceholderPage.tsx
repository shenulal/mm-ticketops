interface Props { title: string; }

const PlaceholderPage: React.FC<Props> = ({ title }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <h2 className="font-display text-2xl text-navy mb-2">{title}</h2>
      <p className="text-text-muted font-body text-sm">This page is under construction.</p>
    </div>
  </div>
);

export default PlaceholderPage;
