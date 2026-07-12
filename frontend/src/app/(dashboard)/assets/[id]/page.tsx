interface AssetDetailPageProps {
  params: {
    id: string;
  };
}

export default function AssetDetailPage({ params }: AssetDetailPageProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Asset Details: {params.id}</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-500">Asset details information and allocation history tabs.</p>
      </div>
    </div>
  );
}
