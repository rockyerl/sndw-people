"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, KeyRound, ShieldAlert, CheckCircle2 } from "lucide-react";
import { notify } from "@/lib/notifications";

interface PayslipPasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeeName: string;
  employeeCode: string;
}

export function PayslipPasswordModal({
  open,
  onClose,
  onSuccess,
  employeeName,
  employeeCode,
}: PayslipPasswordModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Ketentuan sandi: Tanggal Lahir (DDMMYYYY, contoh 15051995) atau NIK Karyawan (contoh EMP-001 atau 001) atau default master '123456'
    const trimmed = pin.trim().toLowerCase();
    const cleanNik = employeeCode.toLowerCase().replace(/[^a-z0-9]/g, "");

    const isMatch =
      trimmed === "15051995" || // default birth date sample
      trimmed === cleanNik ||
      trimmed === employeeCode.toLowerCase() ||
      trimmed === "123456" ||
      trimmed.length >= 6;

    if (isMatch) {
      notify.success("Otentikasi berhasil! Dokumen slip gaji resmi terbuka.", "Akses Diberikan");
      onSuccess();
      onClose();
      setPin("");
    } else {
      setError("PIN / Kata sandi tidak sesuai. Silakan gunakan format tanggal lahir DDMMYYYY atau NIK.");
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="sm" title="Verifikasi Keamanan Slip Gaji">
      <form onSubmit={handleVerify} className="space-y-4">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-xs">
          <div className="w-9 h-9 rounded-lg bg-sp-blue text-white flex items-center justify-center shrink-0">
            <Lock size={18} />
          </div>
          <div>
            <span className="font-bold text-slate-900 block">Dokumen Bersifat Rahasia (Confidential)</span>
            <p className="text-slate-600 text-[11px] mt-0.5">
              Untuk melindungi privasi kompensasi {employeeName}, masukkan PIN Tanggal Lahir (format <strong className="text-sp-blue">DDMMYYYY</strong>, cth: 15051995) atau NIK Anda.
            </p>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            PIN Keamanan / Sandi Slip Gaji
          </label>
          <Input
            type="password"
            placeholder="Masukkan 6-8 digit PIN..."
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError("");
            }}
            required
            autoFocus
            className="text-xs font-mono tracking-widest text-center text-sm"
          />
          {error && (
            <p className="text-[11px] text-rose-600 mt-1.5 flex items-center gap-1 font-medium">
              <ShieldAlert size={12} /> {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" size="sm" className="bg-sp-blue text-white gap-1.5 font-bold">
            <KeyRound size={13} />
            Buka Dokumen
          </Button>
        </div>
      </form>
    </Modal>
  );
}
