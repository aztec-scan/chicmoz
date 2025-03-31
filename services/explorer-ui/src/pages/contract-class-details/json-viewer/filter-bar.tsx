import { type FC, useState } from "react";

interface FilterBarProps {
  onFilterChange: (filter: string) => void;
}

export const FilterBar: FC<FilterBarProps> = ({ onFilterChange }) => {
  const [filter, setFilter] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilter = e.target.value;
    setFilter(newFilter);
    onFilterChange(newFilter);
  };

  return (
    <div className="mb-4">
      <input
        type="text"
        placeholder="Filter JSON..."
        className="w-full p-2 border border-gray-300 rounded-md"
        value={filter}
        onChange={handleChange}
      />
    </div>
  );
};
