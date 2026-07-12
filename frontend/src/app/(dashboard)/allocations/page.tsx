import Link from "next/link";

export default function AllocationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Allocations</h1>
        <Link href="/allocations/transfers" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Transfers View
        </Link>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <p>Allocations list and tracking.</p>
      </div>
    </div>
  );
}
