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
import React, { useState } from 'react';

/**
 * Internal dependencies.
 */
// eslint-disable-next-line import/no-relative-packages
import { ArrowDown } from '../../../../../../icons';
import SubList from './subList';
import type {
  SelectedFilters,
  Filter,
} from '../../../../stateProviders/filterManagementStore/types';

interface ListItemProps {
  filter: Filter;
  selectedFilters: SelectedFilters;
  setSelectedFilters: (
    update: (prevState: SelectedFilters) => SelectedFilters
  ) => void;
}

const ListItem: React.FC<ListItemProps> = ({
  filter,
  selectedFilters,
  setSelectedFilters,
}) => {
  const [isExpanded, setExpanded] = useState<boolean>(false);
  const [showSubList, setShowSubList] = useState<boolean>(false);

  const toggleShowMore = () => {
    setExpanded(!isExpanded);
  };

  const toggleSubList = () => {
    setShowSubList(!showSubList);
  };

  const handleFilterChange = (
    checked: boolean,
    keys: string,
    value: string
  ) => {
    setSelectedFilters((prevState: SelectedFilters) => {
      const newValue: SelectedFilters = { ...prevState };
      const newValueForKey: Set<string> = newValue[keys] || new Set<string>();

      if (checked) {
        newValueForKey.add(value);
      } else {
        newValueForKey.delete(value);
      }

      if (newValueForKey.size) {
        newValue[keys] = newValueForKey;
      } else {
        delete newValue[keys];
      }

      return newValue;
    });
  };

  return (
    <li className="py-[3px]">
      <a
        href="#"
        className="flex items-center text-asteriod-black dark:text-bright-gray"
        onClick={toggleSubList}
      >
        <span className={showSubList ? '' : '-rotate-90'}>
          <ArrowDown />
        </span>
        <p className="ml-1 leading-normal font-semi-thick">{filter.name}</p>
      </a>
      {showSubList && (
        <>
          <SubList
            filter={filter}
            selectedFilters={selectedFilters}
            handleFilterChange={handleFilterChange}
            isExpanded={isExpanded}
          />
          {Number(filter?.filters?.size) > 4 && (
            <a
              onClick={toggleShowMore}
              className="text-md text-link ml-2 mt-1 block text-royal-blue dark:text-medium-persian-blue"
              href="#"
            >
              {isExpanded ? 'Show Less' : 'Show More'}
            </a>
          )}
        </>
      )}
    </li>
  );
};

export default ListItem;
