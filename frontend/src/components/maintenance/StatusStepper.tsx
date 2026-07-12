interface StatusStepperProps {
  currentStatus: string;
}

export default function StatusStepper({ currentStatus }: StatusStepperProps) {
  const steps = ["scheduled", "in_progress", "completed"];

  return (
    <div className="flex items-center space-x-4">
      {steps.map((step, idx) => (
        <div key={step} className="flex items-center">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            currentStatus === step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
          }`}>
            {step}
          </span>
          {idx < steps.length - 1 && <span className="text-gray-300 mx-2">→</span>}
        </div>
      ))}
    </div>
  );
}
