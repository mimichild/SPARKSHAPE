export const documentDirectory = '/mock/documents/';

export const makeDirectoryAsync = jest.fn().mockResolvedValue(undefined);
export const deleteAsync = jest.fn().mockResolvedValue(undefined);
export const copyAsync = jest.fn().mockResolvedValue(undefined);
export const moveAsync = jest.fn().mockResolvedValue(undefined);
export const getInfoAsync = jest.fn().mockResolvedValue({ exists: false });
export const readAsStringAsync = jest.fn().mockResolvedValue('');
export const writeAsStringAsync = jest.fn().mockResolvedValue(undefined);
