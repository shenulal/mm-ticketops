import { useParams } from 'react-router-dom';

const PAGE_INFO: Record<string, { title: string; description: string }> = {
  vendors: { title: 'Vendors', description: 'Manage ticket vendors and marketplace connections.' },
  clients: { title: 'Clients', description: 'Manage client companies, contacts, and credit terms.' },
  contracts: { title: 'Contracts', description: 'View and manage purchase and sale contracts.' },
  venues: { title: 'Venues', description: 'Manage event venues and locations.' },
  currencies: { title: 'Currencies', description: 'Configure active currencies and exchange rates.' },
};

export default function MasterDataPage() {
  const { entity } = useParams<{ entity: string }>();
  const info = PAGE_INFO[entity ?? ''] ?? { title: 'Master Data', description: '' };

  return (
    <div>
      <h1 className="font-display text-[26px] mb-2 text-primary">{info.title}</h1>
      <p className="font-body text-sm text-muted-foreground mb-6">{info.description}</p>
      <div className="bg-card rounded-xl shadow-sm border border-border p-8 text-center">
        <p className="font-body text-muted-foreground">
          {info.title} management coming soon. This will connect to AppContext for live data.
        </p>
      </div>
    </div>
  );
}
