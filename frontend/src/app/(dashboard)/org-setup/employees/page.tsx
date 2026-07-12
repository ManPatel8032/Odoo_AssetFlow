export default function EmployeesPage() {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Employees</h2>
      <ul className="divide-y divide-gray-200">
        <li className="py-3 flex justify-between items-center">
          <span>John Doe (employee)</span>
          <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Promote</button>
        </li>
      </ul>
    </div>
  );
}
