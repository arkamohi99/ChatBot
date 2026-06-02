import { quickActions } from "../../data/quickActions";

export default function QuickActions({ onAction }) {
  return (
    <div className="px-6 py-3 border-b border-gray-100">
      <div className="flex gap-2 overflow-x-auto">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction(action)}
            className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-full text-purple-700 text-sm whitespace-nowrap hover:bg-purple-100 transition"
          >
            <span className="mr-2">{action.icon}</span>
            {action.title}
          </button>
        ))}
      </div>
    </div>
  );
}