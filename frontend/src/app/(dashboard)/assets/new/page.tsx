import AssetForm from "@/components/assets/AssetForm";

export default function NewAssetPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Register New Asset</h1>
      <AssetForm />
    </div>
  );
}
