import { useRef } from "react";
import { Download, Upload, FileText, FileSpreadsheet, Braces } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  onExportCSV: () => void;
  onExportExcel: () => void;
  onExportJSON: () => void;
  onImport: (file: File) => void;
  acceptedImport?: string;
}

export function ExportImportBar({
  onExportCSV, onExportExcel, onExportJSON, onImport, acceptedImport = ".csv,.json",
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = "";
    }
  };

  return (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onExportCSV}>
            <FileText className="h-4 w-4 mr-2" /> CSV (.csv)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel (.xlsx)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportJSON}>
            <Braces className="h-4 w-4 mr-2" /> JSON (.json)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
        <Upload className="h-3.5 w-3.5" /> Import
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept={acceptedImport}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
