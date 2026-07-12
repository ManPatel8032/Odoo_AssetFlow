interface AssetCardProps {
  name: string;
  tag: string;
  status: string;
}

export default function AssetCard({ name, tag, status }: AssetCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
      <div>
        <h3 className="font-bold text-lg">{name}</h3>
        <p className="text-sm text-gray-500">Tag: {tag}</p>
      </div>
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
        status === "available" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
      }`}>
        {status}
      </span>
    </div>
  );
}
