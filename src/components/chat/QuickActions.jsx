import { quickActions } from "../../data/quickActions";

export default function QuickActions({ onAction }) {
  return (
    <div className="px-6 py-3 flex border-b border-gray-100 w-full">
      <div className="flex gap-3 items-center w-full justify-center flex-wrap">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction(action.title)}
            className="px-5 py-2.5 bg-purple-50 border border-purple-200 rounded-full 
                       text-purple-700 text-base font-medium whitespace-nowrap 
                       hover:bg-purple-100 active:bg-purple-200 transition-all 
                       flex items-center gap-2"
          >
            <span className="text-lg">{action.icon}</span>
            {action.title}
          </button>
        ))}
      </div>
    </div>
  );
}