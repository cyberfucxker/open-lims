export interface CitySlotConfigDto {
  cityId: string;
  cityName: string;
  useNewSlotSystem: boolean;
  templates: Array<{
    slotTemplateId: string;
    title: string;
    startTime: string;
    endTime: string;
    active: boolean;
    assigned: boolean;
  }>;
}

export interface AssignCitySlotTemplatesData {
  cityId: string;
  slotTemplateIds: string[];
}
