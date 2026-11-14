export interface HolidayDto {
  id: string;
  cityId: string;
  cityName: string;
  holidayDate: string;
  reason: string;
  createdAt: string;
}

export interface HolidayWriteData {
  cityId: string;
  holidayDate: string;
  reason: string;
}

export interface ListHolidaysParams {
  cityId?: string;
  dateFrom?: string;
  dateTo?: string;
}
