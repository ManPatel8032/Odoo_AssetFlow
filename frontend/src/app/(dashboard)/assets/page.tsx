import Link from "next/link";
import AssetTable from "@/components/assets/AssetTable";

export default function AssetsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Assets</h1>
        <Link href="/assets/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Register Asset
        </Link>
      </div>
      <AssetTable />
    </div>
  );
}
