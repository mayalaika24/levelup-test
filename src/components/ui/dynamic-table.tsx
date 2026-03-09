"use client";

import { type ReactNode } from "react";
import { Typography } from "@/components/ui/typography";

export type DynamicTableColumn<TData> = {
  key: string;
  header: ReactNode;
  className?: string;
  render: (row: TData) => ReactNode;
};

type DynamicTableProps<TData> = {
  data: TData[];
  columns: DynamicTableColumn<TData>[];
  getRowKey: (row: TData) => string;
  emptyMessage: string;
};

export function DynamicTable<TData>({
  data,
  columns,
  getRowKey,
  emptyMessage,
}: DynamicTableProps<TData>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/70">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-muted/40">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={`px-3 py-2 text-start font-semibold text-foreground ${column.className ?? ""}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center">
                <Typography variant="muted">{emptyMessage}</Typography>
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={getRowKey(row)} className="border-t border-border/70 bg-background/70">
                {columns.map((column) => (
                  <td key={column.key} className={`px-3 py-2 align-top text-foreground ${column.className ?? ""}`}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
