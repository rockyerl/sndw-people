"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Download, ShieldCheck, FileCheck, Building } from "lucide-react";
import { generateForm1721A1, Form1721A1Data } from "@/lib/payroll/tax-1721-a1";
import { notify } from "@/lib/notifications";

interface Form1721A1ModalProps {
  open: boolean;
  onClose: () => void;
  payrollSummary: any;
  year?: string;
}

export function Form1721A1Modal({
  open,
  onClose,
  payrollSummary,
  year = "2026",
}: Form1721A1ModalProps) {
  if (!payrollSummary) return null;

  const data: Form1721A1Data = generateForm1721A1(payrollSummary, year);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="2xl"
      title="Bukti Potong PPh 21 Resmi — Formulir 1721-A1 (DJP Online)"
    >
      <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        {/* Container Dokumen Resmi Cetak */}
        <div className="bg-white border-2 border-slate-300 rounded-xl p-6 text-slate-800 text-xs shadow-xs space-y-4 font-sans">
          {/* Header DJP & Formulir */}
          <div className="border-b-2 border-slate-800 pb-3 flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-sp-navy text-sp-gold flex items-center justify-center font-bold text-xl shrink-0">
                DJP
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  KEMENTERIAN KEUANGAN REPUBLIK INDONESIA • DIREKTORAT JENDERAL PAJAK
                </p>
                <h2 className="text-sm font-extrabold text-slate-900 tracking-tight mt-0.5">
                  BUKTI PEMOTONGAN PAJAK PENGHASILAN PASAL 21 (FORMULIR 1721-A1)
                </h2>
                <p className="text-[10px] text-slate-500">
                  Bagi Pegawai Tetap atau Penerima Pensiun/Tunjangan Hari Tua Berkala
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="font-extrabold text-sm font-mono block text-slate-900">FORMULIR 1721 - A1</span>
              <span className="text-[11px] font-bold text-sp-blue block font-mono">TAHUN PAJAK: {data.tahunPajak}</span>
              <span className="text-[10px] text-slate-500 font-mono">Nomor: {data.nomorBuktiPotong}</span>
            </div>
          </div>

          {/* Bagian A & B: Identitas Pemotong & Penerima */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Bagian A: Pemotong Pajak */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-[11px]">
              <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1 uppercase tracking-wider text-[10px] text-sp-blue">
                A. IDENTITAS PEMOTONG PAJAK
              </span>
              <div>
                <span className="text-slate-500 block text-[10px]">NPWP Pemotong:</span>
                <span className="font-mono font-bold text-slate-800">{data.pemotong.npwp}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Nama Perusahaan:</span>
                <span className="font-semibold text-slate-800">{data.pemotong.nama}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Alamat Resmi:</span>
                <span className="text-slate-700">{data.pemotong.alamat}</span>
              </div>
            </div>

            {/* Bagian B: Penerima Penghasilan */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-[11px]">
              <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1 uppercase tracking-wider text-[10px] text-sp-blue flex justify-between">
                <span>B. PENERIMA PENGHASILAN</span>
                <Badge variant="blue" className="text-[9px] py-0 px-1.5">PTKP: {data.karyawan.ptkpStatus}</Badge>
              </span>
              <div>
                <span className="text-slate-500 block text-[10px]">Nama Karyawan:</span>
                <span className="font-bold text-slate-800">{data.karyawan.nama}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block text-[10px]">NIK:</span>
                  <span className="font-mono font-semibold text-slate-800">{data.karyawan.nik}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">NPWP Pribadi:</span>
                  <span className="font-mono text-slate-800">{data.karyawan.npwp}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Jabatan / Status:</span>
                <span className="text-slate-700 font-medium">{data.karyawan.jabatan} • {data.karyawan.statusKaryawan}</span>
              </div>
            </div>
          </div>

          {/* Bagian C & D: Rincian Penghasilan Bruto & Pengurang */}
          <div className="space-y-2 border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 p-2 font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              C. RINCIAN PENGHASILAN BRUTO SETAHUN
            </div>
            <div className="p-3 space-y-1 text-[11px]">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">1. Gaji Pokok / Pensiun Setahun</span>
                <span className="font-mono font-semibold">{formatRupiah(data.penghasilanBruto.gajiPokokSetahun)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">2. Tunjangan Tetap / Jabatan / Operasional</span>
                <span className="font-mono font-semibold">{formatRupiah(data.penghasilanBruto.tunjanganTetapSetahun)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">3. Uang Lembur & Honorarium</span>
                <span className="font-mono font-semibold">{formatRupiah(data.penghasilanBruto.uangLemburSetahun)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">4. Premi Asuransi/BPJS Dibayar Pemberi Kerja (Kes 4% + JKK + JKM)</span>
                <span className="font-mono font-semibold">{formatRupiah(data.penghasilanBruto.premiBpjsDibayarPemberiKerja)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">5. Tantiem, Bonus, Gratifikasi, Jasa Produksi & THR</span>
                <span className="font-mono font-semibold">{formatRupiah(data.penghasilanBruto.bonusDanThr)}</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-slate-900 bg-slate-50 px-2 rounded">
                <span>JUMLAH PENGHASILAN BRUTO SETAHUN (1 s.d. 5)</span>
                <span className="font-mono text-sp-blue">{formatRupiah(data.penghasilanBruto.totalPenghasilanBruto)}</span>
              </div>
            </div>

            <div className="bg-slate-100 p-2 font-bold text-slate-800 text-[11px] uppercase tracking-wider border-t border-slate-200">
              D. PENGURANG PENGHASILAN (DEDUCTIONS)
            </div>
            <div className="p-3 space-y-1 text-[11px]">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <div>
                  <span className="text-slate-600">6. Biaya Jabatan (5% dari Bruto, Maks. Rp 6.000.000/thn)</span>
                </div>
                <span className="font-mono font-semibold text-rose-600">-{formatRupiah(data.pengurang.biayaJabatan)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <div>
                  <span className="text-slate-600">7. Iuran Pensiun / JHT yang Dibayar Pegawai (BPJS TK JHT 2% + JP 1%)</span>
                </div>
                <span className="font-mono font-semibold text-rose-600">-{formatRupiah(data.pengurang.iuranPensiunJhtPegawai)}</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-slate-900 bg-slate-50 px-2 rounded">
                <span>JUMLAH PENGURANG (6 + 7)</span>
                <span className="font-mono text-rose-700">-{formatRupiah(data.pengurang.totalPengurang)}</span>
              </div>
            </div>

            <div className="bg-blue-50/70 p-2 font-bold text-sp-blue text-[11px] uppercase tracking-wider border-t border-slate-200">
              E. PERHITUNGAN PPh PASAL 21 TERUTANG (UU HPP & TARIF PASAL 17)
            </div>
            <div className="p-3 space-y-1 text-[11px]">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-700 font-medium">8. Jumlah Penghasilan Neto Setahun (Bruto - Pengurang)</span>
                <span className="font-mono font-semibold">{formatRupiah(data.perhitunganPph21.penghasilanNetoSetahun)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-700 font-medium">9. Penghasilan Tidak Kena Pajak (PTKP {data.karyawan.ptkpStatus})</span>
                <span className="font-mono font-semibold">-{formatRupiah(data.perhitunganPph21.ptkp)}</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-slate-900 bg-slate-50 px-2 rounded">
                <span>10. PENGHASILAN KENA PAJAK (PKP) SETAHUN (8 - 9 Dibulatkan)</span>
                <span className="font-mono text-slate-900">{formatRupiah(data.perhitunganPph21.penghasilanKenaPajakPkp)}</span>
              </div>
              <div className="flex justify-between py-2 font-extrabold text-sm text-sp-blue bg-blue-100/60 p-2 rounded mt-2">
                <span>11. PPh PASAL 21 TERUTANG SETAHUN (TARIF PASAL 17)</span>
                <span className="font-mono">{formatRupiah(data.perhitunganPph21.pph21TerutangSetahun)}</span>
              </div>
            </div>
          </div>

          {/* Tanda Tangan & QR Pengesahan */}
          <div className="flex justify-between items-end pt-3 border-t border-slate-200 text-[10px]">
            <div className="space-y-1 text-slate-500">
              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                <ShieldCheck size={14} /> Dokumen Bukti Potong Sah Ditjen Pajak RI
              </span>
              <p>Divalidasi secara digital melalui sistem SUNDAWA People HRIS.</p>
              <p className="font-mono">ID Validasi: STI-1721A1-{data.tahunPajak}-{data.karyawan.nik}</p>
            </div>

            <div className="text-center space-y-1 pr-4">
              <p className="text-slate-500">Bandung, 31 Desember {data.tahunPajak}</p>
              <p className="font-bold text-slate-900">PT SUNDAWA TEKNOLOGI INDONESIA</p>
              <div className="w-24 h-12 mx-auto border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400">
                [Tanda Tangan Digital & Cap Perusahaan]
              </div>
              <p className="font-bold text-slate-800 underline">Direktur Keuangan & SDM</p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
          <Button
            size="sm"
            onClick={() => {
              notify.success("Bukti Potong PPh 21 (Form 1721-A1) siap dicetak", "Form 1721-A1");
              window.print();
            }}
            className="bg-sp-blue text-white gap-1.5"
          >
            <Printer size={14} />
            Cetak Form 1721-A1
          </Button>
        </div>
      </div>
    </Modal>
  );
}
