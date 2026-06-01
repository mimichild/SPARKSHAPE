const mockRun = jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 });
const mockGetAllAsync = jest.fn().mockResolvedValue([]);
const mockGetFirstAsync = jest.fn().mockResolvedValue(null);
const mockExecAsync = jest.fn().mockResolvedValue(undefined);

const mockDb = {
  runAsync: mockRun,
  getAllAsync: mockGetAllAsync,
  getFirstAsync: mockGetFirstAsync,
  execAsync: mockExecAsync,
};

export const openDatabaseAsync = jest.fn().mockResolvedValue(mockDb);
export const SQLiteProvider = ({ children }: { children: React.ReactNode }) => children;
export const useSQLiteContext = jest.fn().mockReturnValue(mockDb);

export { mockDb, mockRun, mockGetAllAsync, mockGetFirstAsync, mockExecAsync };
