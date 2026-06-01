export interface BodyPhoto {
  id: string;
  takenAt: string;
  note: string | null;
  thumbPath: string;
  gridPath: string;
  detailPath: string;
  fullPath: string;
}

export interface BodyPhotoInput {
  takenAt: string;
  note: string | null;
  thumbPath: string;
  gridPath: string;
  detailPath: string;
  fullPath: string;
}
