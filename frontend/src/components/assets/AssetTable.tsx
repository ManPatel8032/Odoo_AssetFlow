import Link from "next/link";

export default function AssetTable() {
  const mockAssets = [
    { id: "1", name: "MacBook Pro 16", tag: "AST-001", status: "available" },
    { id: "2", name: "Dell UltraSharp 27", tag: "AST-002", status: "allocated" },
  ];

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tag</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {mockAssets.map((asset) => (
            <tr key={asset.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{asset.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.tag}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.status}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                <Link href={`/assets/${asset.id}`}>View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
