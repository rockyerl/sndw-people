"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChangePasswordFormData } from "@/types/features/domain.type";
import { Key, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useChangePassword } from "@/features/profile/hooks/profile-queries";
import { notify } from "@/lib/notifications";

function PassField({
  label,
  show,
  setShow,
  value,
  onChange,
}: {
  label: string;
  show: boolean;
  setShow: (v: boolean) => void;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-sp-text mb-1">{label}</label>
      <div className="relative">
        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sp-muted" />
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 pr-10"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sp-muted hover:text-sp-text"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export function PasswordFormTab() {
  const changeMutation = useChangePassword();
  const [saved, setSaved] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState<ChangePasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  function handleChange() {
    if (form.newPassword !== form.confirmPassword) {
      notify.error("Password baru dan konfirmasi tidak cocok", "Validasi Gagal");
      return;
    }
    if (form.newPassword.length < 6) {
      notify.warning("Password baru minimal harus 6 karakter", "Validasi Password");
      return;
    }
    changeMutation.mutate(form, {
      onSuccess: () => {
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setSaved(true);
        notify.success("Kata sandi akun Anda berhasil diperbarui", "Berhasil");
        setTimeout(() => setSaved(false), 3000);
      },
      onError: (err: any) => {
        notify.error(err?.message || "Gagal mengubah kata sandi", "Gagal");
      },
    });
  }

  return (
    <Card className="max-w-xl">
      <CardContent className="pt-6">
        {saved && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-sp-success/10 border border-sp-success/20 text-sp-success text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Password berhasil diubah!
          </div>
        )}

        <div className="space-y-4">
          <PassField
            label="Password Saat Ini"
            show={showCurrent}
            setShow={setShowCurrent}
            value={form.currentPassword}
            onChange={(v) => setForm((p) => ({ ...p, currentPassword: v }))}
          />
          <PassField
            label="Password Baru"
            show={showNew}
            setShow={setShowNew}
            value={form.newPassword}
            onChange={(v) => setForm((p) => ({ ...p, newPassword: v }))}
          />
          <div>
            <PassField
              label="Konfirmasi Password Baru"
              show={showConfirm}
              setShow={setShowConfirm}
              value={form.confirmPassword}
              onChange={(v) => setForm((p) => ({ ...p, confirmPassword: v }))}
            />
            {form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <p className="text-xs text-sp-danger mt-1">Password tidak cocok</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleChange}
            className="w-full sm:w-auto"
            disabled={
              changeMutation.isPending ||
              form.newPassword !== form.confirmPassword ||
              !form.currentPassword ||
              !form.newPassword
            }
          >
            <Key className="w-4 h-4" />
            {changeMutation.isPending ? "Mengubah..." : "Ubah Password"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
