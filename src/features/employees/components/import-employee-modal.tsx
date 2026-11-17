"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileSpreadsheet, AlertCircle } from "lucide-react";
import { exportToCsv } from "@/lib/export-csv";
import { notify } from "@/lib/notifications";
import { useQueryClient } from "@tanstack/react-query";

interface ImportEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportEmployeeModal({ open, onOpenChange }: ImportEmployeeModalProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleDownloadTemplate = () => {
    const headers = [
      "Nama Lengkap",
      "Email Kerja",
      "No Telepon",
      "Status",
      "Tanggal Bergabung (YYYY-MM-DD)",
      "Nama Bank",
      "No Rekening",
    ];

    const sampleRows = [
      ["Ahmad Pratama", "ahmad.pratama@sundawa.net", "081234567890", "ACTIVE", "2024-01-15", "BCA", "1234567890"],
      ["Dewi Lestari", "dewi.lestari@sundawa.net", "081298765432", "ACTIVE", "2024-02-01", "Mandiri", "0987654321"],
    ];

    exportToCsv("Template_Import_Karyawan_SUNDAWA", headers, sampleRows);
    notify.success("Template CSV berhasil diunduh. Silakan isi dan unggah kembali.", "Template Siap");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.endsWith(".csv") && !selected.name.endsWith(".txt")) {
        notify.warning("Harap pilih file berformat .CSV", "Format File");
        return;
      }
      setFile(selected);
    }
  };

  const handleProcessImport = async () => {
    if (!file) {
      notify.warning("Pilih file CSV terlebih dahulu", "File Kosong");
      return;
    }

    setIsUploading(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (lines.length <= 1) {
        notify.warning("File tidak memiliki baris data karyawan", "Data Kosong");
        setIsUploading(false);
        return;
      }

      // Parse baris CSV
      let importedCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim());
        const [fullName, workEmail, phone, status, joinDate, bankName, bankAccountNumber] = row;
        if (!fullName) continue;

        await fetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName,
            workEmail: workEmail || undefined,
            phone: phone || undefined,
            status: status || "ACTIVE",
            joinDate: joinDate || new Date().toISOString().split("T")[0],
            bankName: bankName || undefined,
            bankAccountNumber: bankAccountNumber || undefined,
          }),
        });
        importedCount++;
      }

      queryClient.invalidateQueries({ queryKey: ["employees"] });
      notify.success(`Berhasil mengimpor ${importedCount} data karyawan baru!`, "Import Berhasil");
      onOpenChange(false);
      setFile(null);
    } catch {
      notify.error("Gagal memproses file import", "Error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (!isUploading) onOpenChange(v);
      }}
      title="Import Karyawan via CSV"
      description="Unggah file data karyawan untuk menambahkan banyak karyawan sekaligus ke dalam sistem."
      size="md"
    >
      <div className="space-y-4 pt-1">
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
          <FileSpreadsheet className="text-sp-blue shrink-0 mt-0.5" size={20} />
          <div className="text-xs text-slate-700 leading-relaxed">
            <p className="font-semibold text-sp-blue mb-1">Gunakan Template Resmi</p>
            Pastikan format kolom sesuai dengan template standar sistem untuk menghindari kesalahan data.
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="h-7 text-xs bg-white text-sp-blue border-blue-200 hover:bg-blue-50"
              >
                <Download size={13} />
                Unduh Template CSV
              </Button>
            </div>
          </div>
        </div>

        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-sp-blue transition-colors">
          <input
            type="file"
            id="csvUploadInput"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="csvUploadInput" className="cursor-pointer flex flex-col items-center">
            <Upload className="mx-auto text-slate-400 mb-2" size={32} />
            <span className="text-sm font-semibold text-slate-700">
              {file ? file.name : "Klik untuk memilih file CSV"}
            </span>
            <span className="text-xs text-slate-400 mt-1">Format .csv maksimal 5MB</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            variant="default"
            size="sm"
            loading={isUploading}
            disabled={!file}
            onClick={handleProcessImport}
          >
            Mulai Import Karyawan
          </Button>
        </div>
      </div>
    </Modal>
  );
}
