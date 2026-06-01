export const manipulateAsync = jest.fn().mockResolvedValue({
  uri: '/mock/documents/manipulated.jpg',
  width: 400,
  height: 533,
});

export const SaveFormat = {
  JPEG: 'jpeg',
  PNG: 'png',
} as const;
