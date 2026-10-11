import { LayoutGrid, Layers, ListFilter, ArrowUpDown } from 'lucide-react';
import { ViewMode } from '../types/clan';

interface Props {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedDepartment: string;
  onDepartmentChange: (dept: string) => void;
  departments: { name: string; count: number }[];
  sortOption: string;
  onSortChange: (sort: string) => void;
  totalFiltered: number;
}

export function RosterControls({
  viewMode,
  onViewModeChange,
  selectedDepartment,
  onDepartmentChange,
  departments,
  sortOption,
  onSortChange,
  totalFiltered,
}: Props) {
  return (
    <div className="space-y-4">
      {/* View Switcher & Sort Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-850">
        {/* Main View Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl w-fit">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'grid'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-purple-400" />
            <span>All Members</span>
          </button>

          <button
            onClick={() => onViewModeChange('department')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'department'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Department</span>
          </button>

          <button
            onClick={() => onViewModeChange('list')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'list'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden xs:inline">Registry</span>
            <span>List</span>
          </button>
        </div>

        {/* Sort & Count */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-zinc-400 font-medium">
            Showing <span className="text-white font-bold">{totalFiltered}</span> members
          </div>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
            >
              <option value="rank">Order / Rank</option>
              <option value="ign-asc">IGN (A - Z)</option>
              <option value="ign-desc">IGN (Z - A)</option>
              <option value="name-asc">Real Name (A - Z)</option>
              <option value="date-newest">Inducted (Newest)</option>
              <option value="date-oldest">Inducted (Oldest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Division Filter Pills */}
      {departments.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => onDepartmentChange('all')}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
              selectedDepartment === 'all'
                ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-950/40'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white border-zinc-800 hover:border-zinc-700'
            }`}
          >
            All Divisions
          </button>

          {departments.map((dept) => (
            <button
              key={dept.name}
              onClick={() => onDepartmentChange(dept.name)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center gap-1.5 ${
                selectedDepartment === dept.name
                  ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-950/40'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <span>{dept.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedDepartment === dept.name
                    ? 'bg-purple-800 text-white'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {dept.count}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
