/*
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies.
 */
import React from 'react';
import { flexRender, type Cell } from '@tanstack/react-table';

/**
 * Internal dependencies.
 */
import type { TableData } from '..';

interface BodyCellProps {
  cell: Cell<TableData, unknown>;
}

const BodyCell = ({ cell }: BodyCellProps) => {
  return (
    <td
      tabIndex={0}
      style={{ maxWidth: cell.column.getSize() }}
      className={`outline-0 border border-y-0 px-1 py-px truncate border-american-silver h-5 text-xs cursor-default ${
        cell.column.columnDef.header === 'Name' ? 'pl-5' : ''
      }`}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </td>
  );
};

export default BodyCell;
