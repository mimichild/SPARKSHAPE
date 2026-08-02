import { Alert } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { PhotoPreviewModal } from '@/components/PhotoPreviewModal';
import type { BodyPhoto } from '@/types/bodyPhoto';

const samplePhoto: BodyPhoto = {
  id: 'p1',
  takenAt: '2026-05-01T12:00:00.000Z',
  note: null,
  thumbPath: '/t1.jpg',
  gridPath: '/g1.jpg',
  detailPath: '/d1.jpg',
  fullPath: '/f1.jpg',
  photoType: 'front',
  brightness: 1,
  contrast: 1,
  weight: null,
  chest: null,
  waist: null,
  lowerWaist: null,
  hip: null,
};

describe('PhotoPreviewModal', () => {
  it('renders nothing when photo is null', () => {
    const { queryByTestId } = render(
      <PhotoPreviewModal photo={null} onClose={jest.fn()} onEdit={jest.fn()} onDelete={jest.fn()} />,
    );
    expect(queryByTestId('preview-modal')).toBeNull();
  });

  it('pressing the edit button calls onEdit with the current photo', () => {
    const onEdit = jest.fn();
    const { getByTestId } = render(
      <PhotoPreviewModal photo={samplePhoto} onClose={jest.fn()} onEdit={onEdit} onDelete={jest.fn()} />,
    );
    fireEvent.press(getByTestId('preview-edit'));
    expect(onEdit).toHaveBeenCalledWith(samplePhoto);
  });

  it('pressing the delete button asks for confirmation before calling onDelete', () => {
    const onDelete = jest.fn();
    let destructivePress: (() => void) | undefined;
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      destructivePress = buttons?.find((b) => b.style === 'destructive')?.onPress as (() => void) | undefined;
    });
    const { getByTestId } = render(
      <PhotoPreviewModal photo={samplePhoto} onClose={jest.fn()} onEdit={jest.fn()} onDelete={onDelete} />,
    );

    fireEvent.press(getByTestId('preview-delete'));
    expect(alertSpy).toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();

    destructivePress?.();
    expect(onDelete).toHaveBeenCalledWith(samplePhoto);
  });
});
