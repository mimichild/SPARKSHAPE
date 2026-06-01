export type PhotoType = 'front' | 'side';

export interface BodyMeasurements {
  weight:     string | null; // 體重 (kg)
  chest:      string | null; // 胸圍 (cm)
  waist:      string | null; // 腰圍 (cm)
  lowerWaist: string | null; // 下腰圍 (cm)
  hip:        string | null; // 臀圍 (cm)
}

export interface BodyPhoto extends BodyMeasurements {
  id: string;
  takenAt: string;
  note: string | null;
  thumbPath: string;
  gridPath: string;
  detailPath: string;
  fullPath: string;
  photoType: PhotoType;
  brightness: number; // 1.0 = 原始
  contrast:   number; // 1.0 = 原始
}

export interface BodyPhotoInput extends BodyMeasurements {
  takenAt: string;
  note: string | null;
  thumbPath: string;
  gridPath: string;
  detailPath: string;
  fullPath: string;
  photoType: PhotoType;
  brightness: number;
  contrast:   number;
}
