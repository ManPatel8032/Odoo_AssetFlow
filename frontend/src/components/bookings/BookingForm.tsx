export default function BookingForm() {
  return (
    <form className="bg-white p-6 rounded-lg shadow space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Start Time</label>
        <input type="datetime-local" className="mt-1 w-full p-2 border rounded" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">End Time</label>
        <input type="datetime-local" className="mt-1 w-full p-2 border rounded" required />
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Book Asset
      </button>
    </form>
  );
}
