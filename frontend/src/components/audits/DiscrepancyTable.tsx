export default function DiscrepancyTable() {
  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <h3 className="font-bold text-lg text-red-600">Discrepancies / Missing Assets</h3>
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase">Asset</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase">Tag</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase">Audit Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          <tr>
            <td className="py-2 text-sm text-gray-900">External Hard Drive</td>
            <td className="py-2 text-sm text-gray-500">AST-104</td>
            <td className="py-2 text-sm text-red-600 font-medium">Missing</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
