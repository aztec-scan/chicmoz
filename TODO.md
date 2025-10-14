# Validators Pagination Implementation Plan

## Overview

Add pagination to the validators page, making it consistent with how blocks pagination is implemented. This involves changes across all layers: database, API, UI hooks, and UI components.

## Current State Analysis

- **Blocks**: Use `GET /l2/blocks` with `from` and `to` query parameters for range-based pagination
- **Validators**: Currently use `GET /l1/l2-validators` with no pagination, returning all validators

## Implementation Plan

### 1. Database Layer Changes

**File: `services/explorer-api/src/svcs/database/controllers/l1/l2-validator/get-multiple.ts`**

- [ ] Modify `getAllL1L2Validators()` to accept pagination parameters:
  ```typescript
  export async function getAllL1L2Validators(
    status?: ChicmozL1L2Validator["status"],
    options?: { limit?: number; offset?: number },
  ): Promise<ChicmozL1L2Validator[] | null>;
  ```
- [ ] Add `LIMIT` and `OFFSET` to the main query
- [ ] Add consistent sorting by stake (descending) and latestSeenChangeAt for predictable pagination

### 2. API Controller Changes

**File: `services/explorer-api/src/svcs/http-server/routes/controllers/validators.ts`**

- [ ] Add new paginated endpoint: `GET /l1/l2-validators/paginated`
- [ ] Add OpenAPI spec with query parameters:
  ```typescript
  export const openapi_GET_L1_L2_VALIDATORS_PAGINATED: OpenAPIObject["paths"] =
    {
      "/l1/l2-validators/paginated": {
        get: {
          tags: ["L1", "l2-validators"],
          summary: "Get L1 and L2 validators with pagination",
          parameters: [
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", minimum: 1, maximum: 100 },
            },
            {
              name: "offset",
              in: "query",
              schema: { type: "integer", minimum: 0 },
            },
          ],
          responses: l1L2ValidatorResponseArray,
        },
      },
    };
  ```
- [ ] Add controller function `GET_L1_L2_VALIDATORS_PAGINATED`

**File: `services/explorer-api/src/svcs/http-server/routes/paths_and_validation.ts`**

- [ ] Add schema for paginated validators:
  ```typescript
  export const getL1L2ValidatorsPaginatedSchema = z.object({
    query: z.object({
      limit: z.coerce.number().min(1).max(100).optional().default(20),
      offset: z.coerce.number().min(0).optional().default(0),
    }),
  });
  ```

### 3. UI API Layer Changes

**File: `services/explorer-ui/src/api/l1-l2-validator.ts`**

- [ ] Add paginated API method:
  ```typescript
  getValidatorsPaginated: async (
    limit?: number,
    offset?: number,
  ): Promise<ChicmozL1L2Validator[]> => {
    const params: { limit?: number; offset?: number } = {};
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    const response = await client.get(
      aztecExplorer.getL1L2ValidatorsPaginated,
      { params },
    );
    return validateResponse(z.array(chicmozL1L2ValidatorSchema), response.data);
  };
  ```

**File: `services/explorer-ui/src/service/constants.ts`**

- [ ] Add new endpoint constant:
  ```typescript
  getL1L2ValidatorsPaginated: `/l1/l2-validators/paginated`,
  ```

### 4. UI Hooks Changes

**File: `services/explorer-ui/src/hooks/api/l1-l2-validator.ts`**

- [ ] Add paginated hook similar to `usePaginatedTableBlocks`:
  ```typescript
  export const usePaginatedValidators = (
    page = 0,
    pageSize = 20,
  ): UseQueryResult<ChicmozL1L2Validator[], Error> => {
    return useQuery<ChicmozL1L2Validator[], Error>({
      queryKey: queryKeyGenerator.paginatedValidators(page, pageSize),
      queryFn: () => {
        const offset = page * pageSize;
        return L1L2ValidatorAPI.getValidatorsPaginated(pageSize, offset);
      },
      placeholderData: (previousData) => previousData,
    });
  };
  ```

**File: `services/explorer-ui/src/hooks/api/utils.ts`**

- [ ] Add query key generator for paginated validators:
  ```typescript
  paginatedValidators: (page: number, pageSize: number) => ["l1", "l2-validators", "paginated", page, pageSize],
  ```

### 5. UI Page Changes

**File: `services/explorer-ui/src/pages/l1/validators.tsx`**

- [ ] Add pagination state management similar to blocks page:
  ```typescript
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(20);
  ```
- [ ] Replace `useL1L2Validators` with `usePaginatedValidators`
- [ ] Add pagination handlers:
  ```typescript
  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(0);
  };
  ```
- [ ] Update ValidatorsTable props to include pagination controls

### 6. UI Table Component Changes

**File: `services/explorer-ui/src/components/validators/validators-table.tsx`**

- [ ] Add pagination props similar to BlocksTable:
  ```typescript
  interface Props {
    // ... existing props
    currentPage?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    useReactQueryPagination?: boolean;
  }
  ```
- [ ] Pass pagination props to DataTable component

### 7. Additional Considerations

- [ ] **Sorting**: Ensure consistent sorting (by stake desc, then latestSeenChangeAt desc) in database query
- [ ] **Total Count**: Consider adding a separate endpoint to get total validator count for proper pagination UI
- [ ] **Performance**: Test with large validator sets to ensure pagination performs well
- [ ] **Testing**: Add tests for new paginated endpoints and hooks
- [ ] **Migration**: Consider backward compatibility for existing `GET /l1/l2-validators` endpoint

## Progress Tracking

- [x] TODO.md created and committed
- [x] Database layer changes completed
- [x] API controller changes completed
- [x] UI API layer changes completed
- [x] UI hooks changes completed
- [x] UI page changes completed
- [x] UI table component changes completed
- [x] Testing completed (linting passed, code compiles)
- [ ] Documentation updated
