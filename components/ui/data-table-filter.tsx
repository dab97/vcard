import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react"; // Using Plus icon from lucide-react

interface Option {
  value: string;
  label: string;
  count?: number; // Добавляем необязательное свойство count
}

interface DataTableFilterProps {
  title: string;
  options: Option[];
  selectedValues: string[];
  onValueChange: (values: string[]) => void;
}

export function DataTableFilter({
  title,
  options,
  selectedValues,
  onValueChange,
}: DataTableFilterProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredOptions = React.useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const handleCheckboxChange = (value: string, checked: boolean) => {
    if (checked) {
      onValueChange([...selectedValues, value]);
    } else {
      onValueChange(selectedValues.filter(v => v !== value));
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 border-dashed text-xs md:text-sm">
          <Plus className="h-4 w-4" />
          {title}
          {selectedValues.length > 0 && (
            <>
              <span className="ml-2 h-4 w-px bg-border" />
              <span className="ml-2 text-xs md:text-sm font-semibold">
                {selectedValues.length}
              </span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-w-72 p-0" align="start">
        <div className="border-b">
          <Input
            placeholder={`Поиск ${title.toLowerCase()}...`}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-9 w-full text-xs md:text-sm border-none shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-2">
          {filteredOptions.map(option => (
            <div key={option.value} className="flex items-center space-x-2 px-2 py-1.5 hover:bg-slate-100 rounded-md ">
              <Checkbox
                id={`filter-${title}-${option.value}`}
                checked={selectedValues.includes(option.value)}
                onCheckedChange={(checked) => handleCheckboxChange(option.value, checked as boolean)}
              />
              <Label htmlFor={`filter-${title}-${option.value}`} className="flex-1 cursor-pointer text-xs md:text-sm">
                {option.label}
              </Label>
              {option.count !== undefined && (
                <span className="ml-auto text-xs md:text-sm text-muted-foreground">
                  {option.count}
                </span>
              )}
            </div>
          ))}
        </div>
        {selectedValues.length > 0 && (
          <div className="border-t p-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs md:text-sm"
              onClick={() => onValueChange([])}
            >
              Очистить фильтры
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
