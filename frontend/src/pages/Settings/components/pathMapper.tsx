import { ActionButton, FileBrowser, SimpleTable } from "@/components";
import { LOG } from "@/utilities/console";
import { faArrowCircleRight, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { capitalize, isArray, isBoolean } from "lodash";
import {
  createContext,
  FunctionComponent,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { Button } from "react-bootstrap";
import { Column } from "react-table";
import {
  moviesEnabledKey,
  pathMappingsKey,
  pathMappingsMovieKey,
  seriesEnabledKey,
} from "../keys";
import { Message } from "./forms";
import { useExtract, useLatest, useSingleUpdate } from "./hooks";

type SupportType = "sonarr" | "radarr";

function getSupportKey(type: SupportType) {
  if (type === "sonarr") {
    return pathMappingsKey;
  } else {
    return pathMappingsMovieKey;
  }
}

function getEnabledKey(type: SupportType) {
  if (type === "sonarr") {
    return seriesEnabledKey;
  } else {
    return moviesEnabledKey;
  }
}

interface PathMappingItem {
  from: string;
  to: string;
}

type ModifyFn = (index: number, item?: PathMappingItem) => void;

const RowContext = createContext<ModifyFn>(() => {
  LOG("error", "RowContext not initialized");
});

function useRowMutation() {
  return useContext(RowContext);
}

interface TableProps {
  type: SupportType;
}

export const PathMappingTable: FunctionComponent<TableProps> = ({ type }) => {
  const key = getSupportKey(type);
  const items = useLatest<[string, string][]>(key, isArray);

  const enabledKey = getEnabledKey(type);
  const enabled = useExtract<boolean>(enabledKey, isBoolean);

  const update = useSingleUpdate();

  const updateRow = useCallback(
    (newItems: PathMappingItem[]) => {
      update(
        newItems.map((v) => [v.from, v.to]),
        key
      );
    },
    [key, update]
  );

  const addRow = useCallback(() => {
    if (items) {
      const newItems = [...items, ["", ""]];
      update(newItems, key);
    }
  }, [items, key, update]);

  const data = useMemo<PathMappingItem[]>(
    () => items?.map((v) => ({ from: v[0], to: v[1] })) ?? [],
    [items]
  );

  const updateCell = useCallback<ModifyFn>(
    (index, item) => {
      const newItems = [...data];
      if (item) {
        newItems[index] = item;
      } else {
        newItems.splice(index, 1);
      }
      updateRow(newItems);
    },
    [data, updateRow]
  );

  const columns = useMemo<Column<PathMappingItem>[]>(
    () => [
      {
        Header: capitalize(type),
        accessor: "from",
        Cell: ({ value, row }) => {
          const mutate = useRowMutation();

          return (
            <FileBrowser
              drop="up"
              type={type}
              defaultValue={value}
              onChange={(path) => {
                const newItem = { ...row.original };
                newItem.from = path;
                mutate(row.index, newItem);
              }}
            ></FileBrowser>
          );
        },
      },
      {
        id: "arrow",
        className: "text-center",
        Cell: () => (
          <FontAwesomeIcon icon={faArrowCircleRight}></FontAwesomeIcon>
        ),
      },
      {
        Header: "Bazarr",
        accessor: "to",
        Cell: ({ value, row }) => {
          const mutate = useRowMutation();
          return (
            <FileBrowser
              drop="up"
              defaultValue={value}
              type="bazarr"
              onChange={(path) => {
                const newItem = { ...row.original };
                newItem.to = path;
                mutate(row.index, newItem);
              }}
            ></FileBrowser>
          );
        },
      },
      {
        id: "action",
        accessor: "to",
        Cell: ({ row }) => {
          const mutate = useRowMutation();

          return (
            <ActionButton
              icon={faTrash}
              onClick={() => mutate(row.index)}
            ></ActionButton>
          );
        },
      },
    ],
    [type]
  );

  if (enabled) {
    return (
      <RowContext.Provider value={updateCell}>
        <SimpleTable
          emptyText="No Mapping"
          responsive={false}
          columns={columns}
          data={data}
        ></SimpleTable>
        <Button block variant="light" onClick={addRow}>
          Add
        </Button>
      </RowContext.Provider>
    );
  } else {
    return (
      <Message>
        Path Mappings will be available after staged changes are saved
      </Message>
    );
  }
};
