export default function OverdueList() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
      <h3 className="font-bold text-lg text-gray-900">Overdue Returns</h3>
      <ul className="divide-y divide-gray-200">
        <li className="py-3 flex justify-between items-center">
          <div>
            <p className="font-semibold text-sm">MacBook Air (AST-045)</p>
            <p className="text-xs text-gray-500">Employee: Jane Smith</p>
          </div>
          <span className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded">Overdue by 3 days</span>
        </li>
      </ul>
    </div>
  );
}
