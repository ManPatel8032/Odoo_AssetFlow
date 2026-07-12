export default function AssetForm() {
  return (
    <form className="bg-white p-6 rounded-lg shadow space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Asset Name</label>
        <input type="text" className="mt-1 w-full p-2 border rounded" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Asset Tag</label>
        <input type="text" className="mt-1 w-full p-2 border rounded" required />
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Save Asset
      </button>
    </form>
  );
}
