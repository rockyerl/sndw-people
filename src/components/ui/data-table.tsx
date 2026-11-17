"use client";

import { Table, Group, Text } from "@mantine/core";
import { Button } from "./button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReactNode } from "react";

export interface Column<T> {
  accessorKey: string;
  header: string;
  cell?: (value: unknown, row: T) => ReactNode;
  meta?: Record<string, unknown>;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  emptyText?: string;
  className?: string;
}

function getNestedValue(obj: Record<string, unknown>, key: string): unknown {
  // Fast path: bypass .split() for standard non-nested keys
  if (!key.includes(".")) return obj[key];
  const parts = key.split(".");
  let result: unknown = obj;
  for (const part of parts) {
    if (result == null || typeof result !== "object") return undefined;
    result = (result as Record<string, unknown>)[part];
  }
  return result;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  onRowClick,
  emptyText = "Tidak ada data",
  className,
}: DataTableProps<T>) {
  const typedColumns = columns as Column<Record<string, unknown>>[];

  return (
    <div
      className={className}
      style={{
        overflowX: "auto",
        width: "100%",
      }}
    >
      <Table
        horizontalSpacing="md"
        verticalSpacing="md"
        highlightOnHover={!!onRowClick}
        styles={{
          table: {
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
          },
          th: {
            backgroundColor: "#F8FAFC",
            borderBottom: "1px solid #DFE6EF",
            padding: "12px 20px",
            fontWeight: 600,
            fontSize: "12px",
            color: "#60728A",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            whiteSpace: "nowrap",
          },
          td: {
            borderBottom: "1px solid #F1F5F9",
            padding: "14px 20px",
            fontSize: "14px",
            color: "#17263B",
          },
        }}
      >
        <Table.Thead>
          <Table.Tr>
            {typedColumns.map((col, i) => (
              <Table.Th key={i}>
                {col.header}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            Array.from({ length: 4 }).map((_, rIdx) => (
              <Table.Tr key={`skel-${rIdx}`} className="animate-pulse">
                {typedColumns.map((_, cIdx) => (
                  <Table.Td key={`skel-c-${cIdx}`} style={{ padding: "16px 20px" }}>
                    <div
                      className="h-4 bg-slate-200/80 rounded-md"
                      style={{ width: cIdx === 1 ? "75%" : cIdx === 0 ? "45%" : "55%" }}
                    />
                  </Table.Td>
                ))}
              </Table.Tr>
            ))
          ) : data.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={typedColumns.length} style={{ textAlign: "center", padding: "40px" }}>
                <Text c="#60728A" fz="sm">{emptyText}</Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            data.map((row, rowIdx) => (
              <Table.Tr
                key={rowIdx}
                onClick={() => onRowClick?.(row)}
                style={{
                  cursor: onRowClick ? "pointer" : "default",
                  transition: "background-color 0.15s ease",
                }}
              >
                {typedColumns.map((col, colIdx) => {
                  const value = getNestedValue(row, col.accessorKey);
                  return (
                    <Table.Td key={colIdx} style={{ whiteSpace: "nowrap" }}>
                      {col.cell ? col.cell(value, row) : String(value ?? "—")}
                    </Table.Td>
                  );
                })}
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-2 py-3 border-t border-slate-100">
      <Text fz="xs" c="#60728A" className="text-center sm:text-left">
        Menampilkan {Math.min((page - 1) * limit + 1, total)}–
        {Math.min(page * limit, total)} dari {total} data
      </Text>
      <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          leftSection={<ChevronLeft size={15} />}
          className="flex-1 sm:flex-initial text-xs h-8"
        >
          Sebelumnya
        </Button>
        <Text fz="xs" fw={600} c="#60728A" className="px-2 whitespace-nowrap">
          {page} / {totalPages}
        </Text>
        <Button
          variant="outline"
          size="sm"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          rightSection={<ChevronRight size={15} />}
          className="flex-1 sm:flex-initial text-xs h-8"
        >
          Selanjutnya
        </Button>
      </div>
    </div>
  );
}
