interface AuditItemRowProps {
  assetName: string;
  tag: string;
  status: string;
}

export default function AuditItemRow({ assetName, tag, status }: AuditItemRowProps) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-100">
      <div>
        <span className="font-medium">{assetName}</span>
        <span className="text-xs text-gray-500 ml-2">({tag})</span>
      </div>
      <div className="flex space-x-2">
        <button className="bg-green-600 text-white text-xs px-2.5 py-1 rounded">Verify</button>
        <button className="bg-red-600 text-white text-xs px-2.5 py-1 rounded">Missing</button>
      </div>
    </div>
  );
}
