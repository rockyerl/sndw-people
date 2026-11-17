/**
 * Helper Fungsi Terbilang Rupiah Bahasa Indonesia
 * Contoh: 7900000 -> "Tujuh Juta Sembilan Ratus Ribu Rupiah"
 */

const SATUAN = [
  "",
  "Satu",
  "Dua",
  "Tiga",
  "Empat",
  "Lima",
  "Enam",
  "Tujuh",
  "Delapan",
  "Sembilan",
  "Sepuluh",
  "Sebelas",
];

export function terbilang(n: number): string {
  const num = Math.floor(Math.abs(n));
  if (num === 0) return "Nol Rupiah";

  function konversi(val: number): string {
    if (val < 12) {
      return SATUAN[val];
    } else if (val < 20) {
      return konversi(val - 10) + " Belas";
    } else if (val < 100) {
      return konversi(Math.floor(val / 10)) + " Puluh " + konversi(val % 10);
    } else if (val < 200) {
      return "Seratus " + konversi(val - 100);
    } else if (val < 1000) {
      return konversi(Math.floor(val / 100)) + " Ratus " + konversi(val % 100);
    } else if (val < 2000) {
      return "Seribu " + konversi(val - 1000);
    } else if (val < 1000000) {
      return konversi(Math.floor(val / 1000)) + " Ribu " + konversi(val % 1000);
    } else if (val < 1000000000) {
      return konversi(Math.floor(val / 1000000)) + " Juta " + konversi(val % 1000000);
    } else if (val < 1000000000000) {
      return konversi(Math.floor(val / 1000000000)) + " Miliar " + konversi(val % 1000000000);
    } else {
      return konversi(Math.floor(val / 1000000000000)) + " Triliun " + konversi(val % 1000000000000);
    }
  }

  const hasil = konversi(num).replace(/\s+/g, " ").trim();
  return `${hasil} Rupiah`;
}
