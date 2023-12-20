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
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Resizable } from 're-resizable';
import {
  filterCookiesByFrame,
  type CookieTableData,
  getCookieKey,
} from '@ps-analysis-tool/common';
import {
  CookieDetails,
  CookieTable,
  RefreshButton,
  type InfoType,
  type TableColumn,
  type TableFilter,
  ClearAll,
  CrossIcon as ClearSingle,
  type TableData,
} from '@ps-analysis-tool/design-system';

/**
 * Internal dependencies.
 */
import { useCookieStore } from '../../../stateProviders/syncCookieStore';
import getNextIndexToDelete from '../../../../../utils/getNextIndexToDelete';
import EditableTextInput from './editableComponents/editableTextInput';
import EditableCheckBoxInput from './editableComponents/editableCheckBox';
import { BLOCKED_REASON_LIST } from '../../../../../constants';

interface CookiesListingProps {
  setFilteredCookies: React.Dispatch<CookieTableData[]>;
}

const CookiesListing = ({ setFilteredCookies }: CookiesListingProps) => {
  const {
    selectedFrame,
    cookies,
    tabFrames,
    getCookiesSetByJavascript,
    deleteCookie,
    deleteAllCookies,
  } = useCookieStore(({ state, actions }) => ({
    selectedFrame: state.selectedFrame,
    cookies: state.tabCookies || {},
    tabFrames: state.tabFrames,
    getCookiesSetByJavascript: actions.getCookiesSetByJavascript,
    deleteCookie: actions.deleteCookie,
    deleteAllCookies: actions.deleteAllCookies,
  }));

  const [tableData, setTableData] = useState<Record<string, CookieTableData>>(
    {}
  );

  useEffect(() => {
    setTableData((prevData) =>
      Object.values(cookies).reduce((acc, cookie) => {
        const key = getCookieKey(cookie.parsedCookie) as string;
        acc[key] = {
          ...cookie,
          highlighted: prevData?.[key]?.highlighted,
        };

        return acc;
      }, {} as Record<string, CookieTableData>)
    );
  }, [cookies]);

  const removeHighlights = useCallback(() => {
    setTableData((prev) =>
      Object.values(prev).reduce((acc, cookie) => {
        const key = getCookieKey(cookie.parsedCookie) as string;
        acc[key] = {
          ...cookie,
          highlighted: false,
        };

        return acc;
      }, {} as Record<string, CookieTableData>)
    );
  }, []);

  useEffect(() => {
    chrome.storage.session.onChanged.addListener(removeHighlights);
    return () => {
      try {
        chrome.storage.session.onChanged.removeListener(removeHighlights);
      } catch (error) {
        /* do nothing */
      }
    };
  }, [removeHighlights]);

  const rowHighlighter = useCallback(
    (value: boolean, toChangeCookieKey: string) => {
      setTableData((prevData) => {
        const newData = { ...prevData };

        Object.keys(prevData).forEach((key) => {
          const cookieKey = getCookieKey(newData[key].parsedCookie);

          if (cookieKey === toChangeCookieKey) {
            newData[key].highlighted = value;
          }
        });

        return newData;
      });
    },
    []
  );

  const frameFilteredCookies = useMemo(
    () => filterCookiesByFrame(tableData, tabFrames, selectedFrame),
    [tableData, selectedFrame, tabFrames]
  );

  useEffect(() => {
    setFilteredCookies(frameFilteredCookies);
  }, [frameFilteredCookies, setFilteredCookies]);

  const [selectedFrameCookie, setSelectedFrameCookie] = useState<{
    [frame: string]: CookieTableData | null;
  } | null>(null);

  const tableColumns = useMemo<TableColumn[]>(
    () => [
      {
        header: 'Name',
        accessorKey: 'parsedCookie.name',
        cell: (info: InfoType, rowData?: TableData) => (
          <EditableTextInput
            info={info}
            keyToChange="name"
            rowHighlighter={rowHighlighter}
            cookieKey={getCookieKey((rowData as CookieTableData)?.parsedCookie)}
          />
        ),
        enableHiding: false,
      },
      {
        header: 'Scope',
        accessorKey: 'isFirstParty',
        cell: (info: InfoType) => (
          <p className="truncate w-full">
            {!info ? 'Third Party' : 'First Party'}
          </p>
        ),
      },
      {
        header: 'Domain',
        accessorKey: 'parsedCookie.domain',
        cell: (info: InfoType, rowData?: TableData) => (
          <EditableTextInput
            info={info}
            keyToChange="domain"
            rowHighlighter={rowHighlighter}
            cookieKey={getCookieKey((rowData as CookieTableData)?.parsedCookie)}
          />
        ),
      },
      {
        header: 'Partition Key',
        accessorKey: 'parsedCookie.partitionKey',
        cell: (info: InfoType) => info,
      },
      {
        header: 'SameSite',
        accessorKey: 'parsedCookie.samesite',
        cell: (info: InfoType, rowData?: TableData) => (
          <EditableTextInput
            info={info}
            keyToChange="sameSite"
            rowHighlighter={rowHighlighter}
            cookieKey={getCookieKey((rowData as CookieTableData)?.parsedCookie)}
          />
        ),
      },
      {
        header: 'Category',
        accessorKey: 'analytics.category',
        cell: (info: InfoType) => info,
      },
      {
        header: 'Platform',
        accessorKey: 'analytics.platform',
        cell: (info: InfoType) => info,
      },
      {
        header: 'HttpOnly',
        accessorKey: 'parsedCookie.httponly',
        cell: (info: InfoType, rowData?: TableData) => (
          <EditableCheckBoxInput
            info={info}
            keyToChange="httpOnly"
            rowHighlighter={rowHighlighter}
            cookieKey={getCookieKey((rowData as CookieTableData)?.parsedCookie)}
          />
        ),
      },
      {
        header: 'Secure',
        accessorKey: 'parsedCookie.secure',
        cell: (info: InfoType, rowData?: TableData) => (
          <EditableCheckBoxInput
            info={info}
            keyToChange="secure"
            rowHighlighter={rowHighlighter}
            cookieKey={getCookieKey((rowData as CookieTableData)?.parsedCookie)}
          />
        ),
      },
      {
        header: 'Value',
        accessorKey: 'parsedCookie.value',
        cell: (info: InfoType, rowData?: TableData) => (
          <EditableTextInput
            info={info}
            keyToChange="value"
            rowHighlighter={rowHighlighter}
            cookieKey={getCookieKey((rowData as CookieTableData)?.parsedCookie)}
          />
        ),
      },
      {
        header: 'Path',
        accessorKey: 'parsedCookie.path',
        cell: (info: InfoType, rowData?: TableData) => (
          <EditableTextInput
            info={info}
            keyToChange="path"
            rowHighlighter={rowHighlighter}
            cookieKey={getCookieKey((rowData as CookieTableData)?.parsedCookie)}
          />
        ),
      },
      {
        header: 'Expires / Max-Age',
        accessorKey: 'parsedCookie.expires',
        cell: (info: InfoType, details?: TableData) => (
          <EditableTextInput
            info={info}
            keyToChange="expirationDate"
            rowHighlighter={rowHighlighter}
            cookieKey={getCookieKey((details as CookieTableData)?.parsedCookie)}
          />
        ),
      },
      {
        header: 'Priority',
        accessorKey: 'parsedCookie.priority',
        cell: (info: InfoType) => info,
      },
      {
        header: 'Size',
        accessorKey: 'parsedCookie.size',
        cell: (info: InfoType) => info,
      },
    ],
    [rowHighlighter]
  );

  const blockedReasonFilterValues = useMemo<{
    [key: string]: { selected: boolean };
  }>(() => {
    const filterValues: { [key: string]: { selected: boolean } } = {};
    BLOCKED_REASON_LIST.forEach((reason) => {
      filterValues[reason] = { selected: false };
    });
    return filterValues;
  }, []);

  const filters = useMemo<TableFilter>(
    () => ({
      'analytics.category': {
        title: 'Category',
      },
      isFirstParty: {
        title: 'Scope',
        hasStaticFilterValues: true,
        filterValues: {
          'First Party': {
            selected: false,
          },
          'Third Party': {
            selected: false,
          },
        },
        comparator: (value: InfoType, filterValue: string) => {
          const val = value as boolean;
          return val === (filterValue === 'First Party');
        },
      },
      'parsedCookie.domain': {
        title: 'Domain',
      },
      'parsedCookie.httponly': {
        title: 'HttpOnly',
        hasStaticFilterValues: true,
        filterValues: {
          True: {
            selected: false,
          },
          False: {
            selected: false,
          },
        },
        comparator: (value: InfoType, filterValue: string) => {
          const val = value as boolean;
          return val === (filterValue === 'True');
        },
      },
      'parsedCookie.samesite': {
        title: 'SameSite',
        hasStaticFilterValues: true,
        filterValues: {
          None: {
            selected: false,
          },
          Lax: {
            selected: false,
          },
          Strict: {
            selected: false,
          },
        },
        comparator: (value: InfoType, filterValue: string) => {
          const val = value as string;
          return val?.toLowerCase() === filterValue.toLowerCase();
        },
      },
      'parsedCookie.secure': {
        title: 'Secure',
        hasStaticFilterValues: true,
        filterValues: {
          True: {
            selected: false,
          },
          False: {
            selected: false,
          },
        },
        comparator: (value: InfoType, filterValue: string) => {
          const val = value as boolean;
          return val === (filterValue === 'True');
        },
      },
      'parsedCookie.path': {
        title: 'Path',
      },
      'parsedCookie.expires': {
        title: 'Retention Period',
        hasStaticFilterValues: true,
        filterValues: {
          Session: {
            selected: false,
          },
          'Short Term (< 24h)': {
            selected: false,
          },
          'Medium Term (24h - 1 week)': {
            selected: false,
          },
          'Long Term (1 week - 1 month)': {
            selected: false,
          },
          'Extended Term (> 1 month)': {
            selected: false,
          },
        },
        comparator: (value: InfoType, filterValue: string) => {
          let diff = 0;
          const val = value as string;
          switch (filterValue) {
            case 'Session':
              return val === 'Session';

            case 'Short Term (< 24h)':
              diff = Date.parse(val) - Date.now();
              return diff < 86400000;

            case 'Medium Term (24h - 1 week)':
              diff = Date.parse(val) - Date.now();
              return diff >= 86400000 && diff < 604800000;

            case 'Long Term (1 week - 1 month)':
              diff = Date.parse(val) - Date.now();
              return diff >= 604800000 && diff < 2629743833;

            case 'Extended Term (> 1 month)':
              diff = Date.parse(val) - Date.now();
              return diff >= 2629743833;

            default:
              return false;
          }
        },
      },
      'analytics.platform': {
        title: 'Platform',
      },
      blockedReasons: {
        title: 'Cookie Blocked Reasons',
        description: 'Reason why the cookies were blocked.',
        hasStaticFilterValues: true,
        filterValues: blockedReasonFilterValues,
        comparator: (value: InfoType, filterValue: string) => {
          return (value as string[])?.includes(filterValue);
        },
      },
      headerType: {
        title: 'Set Via',
        hasStaticFilterValues: true,
        filterValues: {
          HTTP: {
            selected: false,
          },
          JS: {
            selected: false,
          },
        },
        comparator: (value: InfoType, filterValue: string) => {
          switch (filterValue) {
            case 'JS':
              return value === 'javascript';
            case 'HTTP':
              return value === 'request' || value === 'response';
            default:
              return true;
          }
        },
      },
      'parsedCookie.priority': {
        title: 'Priority',
        hasStaticFilterValues: true,
        filterValues: {
          Low: {
            selected: false,
          },
          Medium: {
            selected: false,
          },
          High: {
            selected: false,
          },
        },
      },
    }),
    [blockedReasonFilterValues]
  );

  const searchKeys = useMemo<string[]>(
    () => ['parsedCookie.name', 'parsedCookie.domain'],
    []
  );

  const tablePersistentSettingsKey = useMemo(() => {
    if (!selectedFrame) {
      return 'cookieListing';
    }

    return `cookieListing#${selectedFrame}`;
  }, [selectedFrame]);

  const selectedCookieIndex = useRef(-1);
  const isDeleteOperationPerformed = useRef(false);

  // This check is because selectedFrameCookie gets value only once when the cookie in the frame is selected.
  // selectedFrameCookie has the following shape.
  // {[frameName]: cookie|null}
  const isAnyCookieSelected =
    isDeleteOperationPerformed.current && !selectedFrameCookie
      ? frameFilteredCookies.length > 0
        ? true
        : false
      : selectedFrameCookie &&
        selectedFrameCookie[Object.keys(selectedFrameCookie)[0]]
      ? true
      : false;

  useEffect(() => {
    isDeleteOperationPerformed.current = false;
  }, [selectedFrame]);

  const handleDeleteCookie = useCallback(() => {
    const selectedIndex = getNextIndexToDelete(
      selectedCookieIndex.current,
      frameFilteredCookies.length
    );
    const selectedKey =
      isDeleteOperationPerformed.current && !selectedFrameCookie
        ? selectedIndex
          ? frameFilteredCookies[selectedIndex]
          : null
        : Object.values(selectedFrameCookie ?? {})[0];

    if (selectedKey !== null && selectedKey && selectedKey.parsedCookie) {
      const cookieKey = getCookieKey(selectedKey?.parsedCookie);
      if (cookieKey) {
        selectedCookieIndex.current = frameFilteredCookies.findIndex(
          (cookie) => getCookieKey(cookie.parsedCookie) === cookieKey
        );
        deleteCookie(cookieKey);
        isDeleteOperationPerformed.current = true;
        const index = getNextIndexToDelete(
          selectedCookieIndex.current,
          frameFilteredCookies.length - 1
        );
        const filteredRows = frameFilteredCookies.filter((cookie) => {
          return (
            cookie.parsedCookie.name +
              cookie.parsedCookie.domain +
              cookie.parsedCookie.path !==
            cookieKey
          );
        });

        if (index !== null && selectedFrame) {
          setSelectedFrameCookie({
            [selectedFrame]: filteredRows[index],
          });
        }
      }
    }
  }, [frameFilteredCookies, selectedFrameCookie, deleteCookie, selectedFrame]);

  const extraInterfaceToTopBar = useMemo(
    () => (
      <>
        <RefreshButton onClick={getCookiesSetByJavascript} />
        <button
          disabled={!isAnyCookieSelected}
          onClick={handleDeleteCookie}
          className={`flex items-center text-center ${
            isAnyCookieSelected
              ? 'text-comet-black dark:text-mischka hover:text-comet-grey hover:dark:text-bright-gray active:dark:text-mischka active:text-comet-black'
              : 'text-mischka dark:text-dark-gray'
          } mx-4`}
          title="Delete selected cookie"
        >
          <ClearSingle className="rotate-45" />
        </button>
        <button
          disabled={!Object.keys(frameFilteredCookies)}
          onClick={deleteAllCookies}
          className={`flex h-full items-end ${
            Object.keys(frameFilteredCookies)
              ? 'text-comet-black dark:text-mischka hover:text-comet-grey hover:dark:text-bright-gray active:dark:text-mischka active:text-comet-black'
              : 'text-mischka dark:text-dark-gray'
          }`}
          title="Delete all cookies"
        >
          <ClearAll />
        </button>
      </>
    ),
    [
      deleteAllCookies,
      frameFilteredCookies,
      getCookiesSetByJavascript,
      handleDeleteCookie,
      isAnyCookieSelected,
    ]
  );

  return (
    <div className="w-full h-full flex flex-col">
      <Resizable
        defaultSize={{
          width: '100%',
          height: '80%',
        }}
        minHeight="6%"
        maxHeight="95%"
        enable={{
          top: false,
          right: false,
          bottom: true,
          left: false,
        }}
        className="h-full flex"
      >
        <CookieTable
          data={frameFilteredCookies}
          tableColumns={tableColumns}
          showTopBar={true}
          tableFilters={filters}
          tableSearchKeys={searchKeys}
          tablePersistentSettingsKey={tablePersistentSettingsKey}
          selectedFrame={selectedFrame}
          selectedFrameCookie={selectedFrameCookie}
          setSelectedFrameCookie={setSelectedFrameCookie}
          extraInterfaceToTopBar={extraInterfaceToTopBar}
        />
      </Resizable>
      <CookieDetails selectedFrameCookie={selectedFrameCookie} />
    </div>
  );
};

export default CookiesListing;
