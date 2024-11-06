import {
  type ColumnDef,
  type ColumnFiltersState,
  type ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  type Table as TableType,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { Fragment, useMemo, useState } from "react";
import { DataTablePagination } from "~/components/data-table/data-table-pagination.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

import { cn } from "~/lib/utils";
import { Loader } from "../loader";

interface DataTableProps<TData, TValue> {
  isLoading?: boolean;
  title?: string;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  disableSizeSelector?: boolean;
}
export function DataTable<TData, TValue>({
  isLoading,
  title,
  columns,
  data,
  disableSizeSelector,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const tableData = useMemo(() => data, [data]);
  const table = useReactTable({
    data: tableData,
    columns: columns,
    state: {
      expanded,
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    enableExpanding: true,
    enableSubRowSelection: true,
    columnResizeMode: "onChange",
    columnResizeDirection: "ltr",
    onExpandedChange: setExpanded,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  return (
<<<<<<< HEAD
    <div className="space-y-4 bg-white rounded-lg p-5">
      {title && <h3 className="ml-0.5">{title}</h3>}
||||||| a7cb79d
    <div className="space-y-4 bg-white rounded-xl">
=======
    <div className="space-y-4 bg-white rounded-lg p-5">
      { title && <h3 className="ml-0.5">{title}</h3> }
>>>>>>> 7924f3ca62e84fb70e0b77618addcab83ecfd01b
      <div className="min-w-full">
        {isLoading && <Loader amount={10} />}
        {!isLoading && (
          <Table className="border-spacing-x-1">
            <DataTableHeader table={table} />
            <DataTableBody table={table} columns={columns} />
          </Table>
        )}
      </div>
<<<<<<< HEAD

      <DataTablePagination
        table={table}
        disableSizeSelector={disableSizeSelector}
      />
||||||| a7cb79d
      <DataTablePagination table={table} />
=======
      <DataTablePagination table={table} disableSizeSelector={disableSizeSelector} />
>>>>>>> 7924f3ca62e84fb70e0b77618addcab83ecfd01b
    </div>
  );
}

interface DataTableChildProps<TData, TValue> {
  table: TableType<TData>;
  flatten?: boolean;
  columns?: ColumnDef<TData, TValue>[];
}
function DataTableHeader<TData, TValue>({
  table,
}: DataTableChildProps<TData, TValue>) {
  return (
    <TableHeader className="">
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id} className="">
          {headerGroup.headers.map((header) => {
            return (
              <TableHead key={header.id} colSpan={header.colSpan}>
                {header.isPlaceholder ||
                  flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                <div
                  {...{
                    onDoubleClick: () => header.column.resetSize(),
                    onMouseDown: header.getResizeHandler(),
                    onTouchStart: header.getResizeHandler(),
                    className: `resizer ${
                      table.options.columnResizeDirection
                    } ${header.column.getIsResizing() ? "isResizing" : ""}`,
                  }}
                />
              </TableHead>
            );
          })}
        </TableRow>
      ))}
    </TableHeader>
  );
}

function DataTableBody<TData, TValue>({
  table,
  flatten,
  columns,
}: DataTableChildProps<TData, TValue>) {
  const groupedRows = ({ table }: DataTableChildProps<TData, TValue>) => {
    return table.getRowModel().rows?.map((row) => {
      return (
        <Fragment key={row.id}>
          <TableRow
            key={row.id}
            data-state={row.getIsSelected() && "selected"}
            onClick={() => row.toggleExpanded()}
            className={cn(
              row.getCanExpand()
                ? "cursor-pointer hover:bg-grey-dark/10 hover:text-pink "
                : ""
            )}
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell
                key={cell.id}
                style={{
                  width: cell.column.getSize() || "auto",
                }}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        </Fragment>
      );
    });
  };
  const flattenedRows = ({ table }: DataTableChildProps<TData, TValue>) => {
    return table.getRowModel().flatRows?.map((row) => {
      return (
        <Fragment key={row.id}>
          <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
            {row.getVisibleCells().map((cell) => (
              <TableCell
                key={cell.id}
                style={{
                  width: cell.column.getSize() || "auto",
                }}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        </Fragment>
      );
    });
  };

  return (
    <TableBody>
      {table.getRowModel().rows?.length ? (
        flatten ? (
          flattenedRows({ table })
        ) : (
          groupedRows({ table })
        )
      ) : (
        <TableRow>
          <TableCell colSpan={columns?.length} className="h-24 text-center">
            No results.
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  );
}
